// ===========================================
// Sync Service
// ===========================================
// Handles bi-directional sync between Clio and local database

import { prisma } from '@/lib/db'
import { ClioClient, createClioClient } from './clio'
import type { ClioBillResponse, ClioLineItemResponse, ClioUserResponse, ClioContactResponse, ClioMatterResponse } from '@/types/clio'
import { Prisma, WorkflowStatus, ActivityType, ActivityStatus, SyncType, SyncStatus } from '@prisma/client'

// ===========================================
// Types
// ===========================================

interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  errors: string[]
}

interface BillSyncResult extends SyncResult {
  billId?: string
  clioId?: string
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Get Clio client for a user
 */
async function getClioClientForUser(userId: string): Promise<ClioClient | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true, refreshToken: true, id: true },
  })

  if (!user?.accessToken) {
    return null
  }

  // Create callback to update tokens in database when they're refreshed
  const onTokenUpdate = async (accessToken: string, refreshToken: string, expiresAt: Date) => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
      },
    })
  }

  return createClioClient(user.accessToken, user.refreshToken || undefined, onTokenUpdate)
}

/**
 * Get any active Clio client (for background sync)
 */
async function getAnyActiveClioClient(): Promise<{ client: ClioClient; userId: string } | null> {
  // Find a user with valid tokens
  const user = await prisma.user.findFirst({
    where: {
      accessToken: { not: null },
      isActive: true,
    },
    select: { id: true, accessToken: true, refreshToken: true },
  })

  if (!user?.accessToken) {
    return null
  }

  const onTokenUpdate = async (accessToken: string, refreshToken: string, expiresAt: Date) => {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
      },
    })
  }

  return {
    client: createClioClient(user.accessToken, user.refreshToken || undefined, onTokenUpdate),
    userId: user.id,
  }
}

/**
 * Create a sync log entry
 */
async function createSyncLog(syncType: SyncType): Promise<string> {
  const log = await prisma.syncLog.create({
    data: {
      syncType,
      status: SyncStatus.RUNNING,
      recordCount: 0,
    },
  })
  return log.id
}

/**
 * Update sync log with results
 */
async function updateSyncLog(
  logId: string,
  status: SyncStatus,
  recordCount: number,
  errorMessage?: string
): Promise<void> {
  await prisma.syncLog.update({
    where: { id: logId },
    data: {
      status,
      recordCount,
      errorMessage,
      completedAt: new Date(),
    },
  })
}

// ===========================================
// User Sync
// ===========================================

/**
 * Sync users from Clio
 */
export async function syncUsers(clioClient: ClioClient): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    errors: [],
  }

  const logId = await createSyncLog(SyncType.USERS)

  try {
    const clioUsers = await clioClient.getAllUsers(true)

    for (const clioUser of clioUsers) {
      result.recordsProcessed++

      try {
        const existingUser = await prisma.user.findUnique({
          where: { clioId: clioUser.id.toString() },
        })

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: clioUser.name,
              email: clioUser.email,
              isActive: clioUser.enabled,
            },
          })
          result.recordsUpdated++
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              clioId: clioUser.id.toString(),
              name: clioUser.name,
              email: clioUser.email,
              isActive: clioUser.enabled,
              role: 'TIMEKEEPER', // Default role
            },
          })
          result.recordsCreated++
        }
      } catch (error) {
        result.errors.push(`Error syncing user ${clioUser.id}: ${error}`)
      }
    }

    result.success = true
    await updateSyncLog(logId, SyncStatus.COMPLETED, result.recordsProcessed)
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`)
    await updateSyncLog(logId, SyncStatus.FAILED, result.recordsProcessed, String(error))
  }

  return result
}

// ===========================================
// Client Sync
// ===========================================

/**
 * Sync or create a client from Clio contact
 */
export async function syncClient(
  clioClient: ClioClient,
  clioContactId: number
): Promise<string | null> {
  try {
    const response = await clioClient.getContact(clioContactId)
    const contact = response.data

    const existingClient = await prisma.client.findUnique({
      where: { clioId: contact.id.toString() },
    })

    if (existingClient) {
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          name: contact.name,
          email: contact.primary_email_address?.address || null,
        },
      })
      return existingClient.id
    }

    const newClient = await prisma.client.create({
      data: {
        clioId: contact.id.toString(),
        name: contact.name,
        email: contact.primary_email_address?.address || null,
      },
    })

    return newClient.id
  } catch (error) {
    console.error(`Error syncing client ${clioContactId}:`, error)
    return null
  }
}

// ===========================================
// Matter Sync
// ===========================================

/**
 * Sync or create a matter
 */
export async function syncMatter(
  clioClient: ClioClient,
  clioMatterId: number
): Promise<string | null> {
  try {
    const response = await clioClient.getMatter(clioMatterId)
    const matter = response.data

    // Sync the client first if present
    let clientId: string | null = null
    if (matter.client?.id) {
      clientId = await syncClient(clioClient, matter.client.id)
    }

    // Get the responsible attorney user ID
    let responsibleAttorneyId: string | null = null
    if (matter.responsible_attorney?.id) {
      const attorney = await prisma.user.findUnique({
        where: { clioId: matter.responsible_attorney.id.toString() },
      })
      responsibleAttorneyId = attorney?.id || null
    }

    const existingMatter = await prisma.matter.findUnique({
      where: { clioId: matter.id.toString() },
    })

    if (existingMatter) {
      await prisma.matter.update({
        where: { id: existingMatter.id },
        data: {
          displayNumber: matter.display_number || null,
          description: matter.description || null,
          clientId,
          responsibleAttorneyId,
        },
      })
      return existingMatter.id
    }

    const newMatter = await prisma.matter.create({
      data: {
        clioId: matter.id.toString(),
        displayNumber: matter.display_number || null,
        description: matter.description || null,
        clientId,
        responsibleAttorneyId,
      },
    })

    return newMatter.id
  } catch (error) {
    console.error(`Error syncing matter ${clioMatterId}:`, error)
    return null
  }
}

// ===========================================
// Bill Sync
// ===========================================

/**
 * Sync a single bill from Clio
 */
export async function syncBill(
  clioClient: ClioClient,
  clioBillId: number
): Promise<BillSyncResult> {
  const result: BillSyncResult = {
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    errors: [],
  }

  try {
    // Get bill details from Clio
    const billResponse = await clioClient.getBill(clioBillId)
    const clioBill = billResponse.data

    result.clioId = clioBill.id.toString()

    // Sync related matter and client
    let matterId: string | null = null
    let clientId: string | null = null

    if (clioBill.matter?.id) {
      matterId = await syncMatter(clioClient, clioBill.matter.id)
    }

    if (clioBill.client?.id) {
      clientId = await syncClient(clioClient, clioBill.client.id)
    }

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: { clioId: clioBill.id.toString() },
    })

    // Prepare bill data
    const billData = {
      billNumber: clioBill.number || `BILL-${clioBill.id}`,
      matterId,
      clientId,
      totalServices: new Prisma.Decimal(clioBill.services_sub_total || clioBill.sub_total || 0),
      totalExpenses: new Prisma.Decimal(clioBill.expenses_sub_total || 0),
      totalAmount: new Prisma.Decimal(clioBill.total || 0),
      discount: new Prisma.Decimal(clioBill.discount?.rate || 0),
      issueDate: clioBill.issued_at ? new Date(clioBill.issued_at) : null,
      dueDate: clioBill.due_at ? new Date(clioBill.due_at) : null,
      billingThroughDate: clioBill.end_at ? new Date(clioBill.end_at) : null,
      clioStatus: clioBill.state,
      syncedAt: new Date(),
    }

    let billId: string

    if (existingBill) {
      // Update existing bill
      await prisma.bill.update({
        where: { id: existingBill.id },
        data: billData,
      })
      billId = existingBill.id
      result.recordsUpdated++
    } else {
      // Create new bill
      const newBill = await prisma.bill.create({
        data: {
          clioId: clioBill.id.toString(),
          ...billData,
          workflowStatus: WorkflowStatus.PENDING,
        },
      })
      billId = newBill.id
      result.recordsCreated++
    }

    result.billId = billId
    result.recordsProcessed++

    // Sync line items (activities)
    const lineItemsResult = await syncBillLineItems(clioClient, clioBillId, billId)
    result.recordsProcessed += lineItemsResult.recordsProcessed
    result.recordsCreated += lineItemsResult.recordsCreated
    result.recordsUpdated += lineItemsResult.recordsUpdated
    result.errors.push(...lineItemsResult.errors)

    result.success = true
  } catch (error) {
    result.errors.push(`Error syncing bill ${clioBillId}: ${error}`)
  }

  return result
}

/**
 * Sync line items (activities) for a bill
 */
export async function syncBillLineItems(
  clioClient: ClioClient,
  clioBillId: number,
  localBillId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    errors: [],
  }

  try {
    const lineItems = await clioClient.getAllBillLineItems(clioBillId)

    for (const lineItem of lineItems) {
      result.recordsProcessed++

      try {
        // Determine activity type
        const activityType: ActivityType = lineItem.type === 'TimeEntry'
          ? ActivityType.TIME_ENTRY
          : ActivityType.EXPENSE

        // Get timekeeper user ID
        let timekeeperId: string | null = null
        const userId = lineItem.user?.id
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { clioId: userId.toString() },
          })
          timekeeperId = user?.id || null
        }

        // Use activity ID if available, otherwise line item ID
        const clioActivityId = lineItem.activity?.id?.toString() || lineItem.id.toString()

        // Check if activity exists
        const existingActivity = await prisma.activity.findUnique({
          where: { clioId: clioActivityId },
        })

        // Activity category will be synced from full activity fetch if needed
        const activityCategory: string | null = null

        const activityData = {
          billId: localBillId,
          type: activityType,
          date: new Date(lineItem.date || new Date()),
          timekeeperId,
          activityCategory,
          utbmsTaskCode: null,
          utbmsActivityCode: null,
          description: lineItem.description || null,
          quantity: lineItem.quantity ? new Prisma.Decimal(lineItem.quantity) : null,
          rate: lineItem.price ? new Prisma.Decimal(lineItem.price) : null,
          total: lineItem.total ? new Prisma.Decimal(lineItem.total) : null,
          isBillable: true,
          vendor: null,
          expenseCode: null,
          syncedAt: new Date(),
        }

        if (existingActivity) {
          await prisma.activity.update({
            where: { id: existingActivity.id },
            data: activityData,
          })
          result.recordsUpdated++
        } else {
          await prisma.activity.create({
            data: {
              clioId: clioActivityId,
              ...activityData,
              status: ActivityStatus.ACTIVE,
              approvedByTimekeeper: false,
            },
          })
          result.recordsCreated++
        }
      } catch (error) {
        result.errors.push(`Error syncing line item ${lineItem.id}: ${error}`)
      }
    }

    result.success = true
  } catch (error) {
    result.errors.push(`Error fetching line items: ${error}`)
  }

  return result
}

// ===========================================
// Sync Awaiting Approval Bills
// ===========================================

/**
 * Sync all bills awaiting approval from Clio
 */
export async function syncAwaitingApprovalBills(userId?: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    errors: [],
  }

  const logId = await createSyncLog(SyncType.BILLS)

  try {
    let clioClient: ClioClient | null

    if (userId) {
      clioClient = await getClioClientForUser(userId)
    } else {
      const clientData = await getAnyActiveClioClient()
      clioClient = clientData?.client || null
    }

    if (!clioClient) {
      throw new Error('No valid Clio client available')
    }

    // Get all awaiting approval bills
    const clioBills = await clioClient.getAllBillsAwaitingApproval()

    console.log(`Found ${clioBills.length} bills awaiting approval`)

    for (const clioBill of clioBills) {
      const billResult = await syncBill(clioClient, clioBill.id)

      result.recordsProcessed += billResult.recordsProcessed
      result.recordsCreated += billResult.recordsCreated
      result.recordsUpdated += billResult.recordsUpdated
      result.errors.push(...billResult.errors)
    }

    result.success = result.errors.length === 0
    await updateSyncLog(logId, SyncStatus.COMPLETED, result.recordsProcessed)
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`)
    await updateSyncLog(logId, SyncStatus.FAILED, result.recordsProcessed, String(error))
  }

  return result
}

// ===========================================
// Push to Clio (Write Operations)
// ===========================================

/**
 * Update an activity in Clio
 */
export async function pushActivityToClio(
  userId: string,
  activityId: string,
  updates: {
    date?: string
    quantity?: number
    rate?: number
    note?: string
    non_billable?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const clioClient = await getClioClientForUser(userId)
    if (!clioClient) {
      return { success: false, error: 'No valid Clio client' }
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    // Get the etag from Clio
    const clioActivity = await clioClient.getActivity(parseInt(activity.clioId))
    const etag = clioActivity.data.etag

    // Update in Clio
    await clioClient.updateActivity(parseInt(activity.clioId), updates, etag)

    // Update local database
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        date: updates.date ? new Date(updates.date) : undefined,
        quantity: updates.quantity ? new Prisma.Decimal(updates.quantity) : undefined,
        rate: updates.rate ? new Prisma.Decimal(updates.rate) : undefined,
        description: updates.note,
        isBillable: updates.non_billable !== undefined ? !updates.non_billable : undefined,
        syncedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Hold an activity (remove from bill in Clio)
 */
export async function holdActivityInClio(
  userId: string,
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const clioClient = await getClioClientForUser(userId)
    if (!clioClient) {
      return { success: false, error: 'No valid Clio client' }
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    // Get the etag from Clio
    const clioActivity = await clioClient.getActivity(parseInt(activity.clioId))
    const etag = clioActivity.data.etag

    // Remove from bill in Clio
    await clioClient.holdActivity(parseInt(activity.clioId), etag)

    // Update local database
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        status: ActivityStatus.HELD,
        billId: null,
        syncedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Delete an activity in Clio
 */
export async function deleteActivityInClio(
  userId: string,
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const clioClient = await getClioClientForUser(userId)
    if (!clioClient) {
      return { success: false, error: 'No valid Clio client' }
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    // Get the etag from Clio
    const clioActivity = await clioClient.getActivity(parseInt(activity.clioId))
    const etag = clioActivity.data.etag

    // Delete in Clio
    await clioClient.deleteActivity(parseInt(activity.clioId), etag)

    // Update local database
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        status: ActivityStatus.DELETED,
        syncedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Approve a bill in Clio (change state to awaiting_payment)
 */
export async function approveBillInClio(
  userId: string,
  billId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const clioClient = await getClioClientForUser(userId)
    if (!clioClient) {
      return { success: false, error: 'No valid Clio client' }
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    })

    if (!bill) {
      return { success: false, error: 'Bill not found' }
    }

    // Get the etag from Clio
    const clioBill = await clioClient.getBill(parseInt(bill.clioId))
    const etag = clioBill.data.etag

    // Update state in Clio to awaiting_payment
    await clioClient.updateBillState(parseInt(bill.clioId), 'awaiting_payment', etag)

    // Update local database
    await prisma.bill.update({
      where: { id: billId },
      data: {
        clioStatus: 'awaiting_payment',
        workflowStatus: WorkflowStatus.APPROVED,
        approvedAt: new Date(),
        syncedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Void a bill in Clio (delete)
 */
export async function voidBillInClio(
  userId: string,
  billId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const clioClient = await getClioClientForUser(userId)
    if (!clioClient) {
      return { success: false, error: 'No valid Clio client' }
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    })

    if (!bill) {
      return { success: false, error: 'Bill not found' }
    }

    // Get the etag from Clio
    const clioBill = await clioClient.getBill(parseInt(bill.clioId))
    const etag = clioBill.data.etag

    // Delete in Clio
    await clioClient.deleteBill(parseInt(bill.clioId), etag)

    // Update local database
    await prisma.bill.update({
      where: { id: billId },
      data: {
        clioStatus: 'deleted',
        workflowStatus: WorkflowStatus.VOIDED,
        syncedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ===========================================
// Export
// ===========================================

export default {
  syncUsers,
  syncClient,
  syncMatter,
  syncBill,
  syncBillLineItems,
  syncAwaitingApprovalBills,
  pushActivityToClio,
  holdActivityInClio,
  deleteActivityInClio,
  approveBillInClio,
  voidBillInClio,
}
