// ===========================================
// Polling Service
// ===========================================
// Background job that polls Clio for new bills awaiting approval

import { prisma } from '@/lib/db'
import { syncAwaitingApprovalBills, syncUsers } from './sync'
import { DEFAULT_SETTINGS } from '@/lib/constants'

// ===========================================
// Configuration
// ===========================================

// Track polling state
let isPolling = false
let pollingIntervalId: NodeJS.Timeout | null = null
let lastPollTime: Date | null = null
let pollErrors: string[] = []

// ===========================================
// Settings Helpers
// ===========================================

/**
 * Get the polling interval from database settings
 */
async function getPollingInterval(): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'polling_interval_minutes' },
    })

    if (setting?.value) {
      const minutes = parseInt(setting.value, 10)
      if (!isNaN(minutes) && minutes > 0) {
        return minutes
      }
    }
  } catch (error) {
    console.error('Error fetching polling interval setting:', error)
  }

  return DEFAULT_SETTINGS.POLLING_INTERVAL_MINUTES
}

/**
 * Check if auto-send first round emails is enabled
 */
async function shouldAutoSendFirstRoundEmails(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'auto_send_first_round_emails' },
    })

    return setting?.value === 'true'
  } catch (error) {
    console.error('Error fetching auto send setting:', error)
  }

  return DEFAULT_SETTINGS.AUTO_SEND_FIRST_ROUND_EMAILS
}

// ===========================================
// Polling Logic
// ===========================================

/**
 * Execute a single poll cycle
 */
export async function executePoll(): Promise<{
  success: boolean
  billsProcessed: number
  newBills: number
  errors: string[]
}> {
  const result = {
    success: false,
    billsProcessed: 0,
    newBills: 0,
    errors: [] as string[],
  }

  console.log(`[${new Date().toISOString()}] Starting poll cycle...`)

  try {
    // Get bills awaiting approval before sync
    const billsBefore = await prisma.bill.count({
      where: { clioStatus: 'awaiting_approval' },
    })

    // Sync awaiting approval bills
    const syncResult = await syncAwaitingApprovalBills()

    result.billsProcessed = syncResult.recordsProcessed
    result.errors = syncResult.errors

    // Get bills after sync to calculate new bills
    const billsAfter = await prisma.bill.count({
      where: { clioStatus: 'awaiting_approval' },
    })

    result.newBills = syncResult.recordsCreated

    // Update last poll time
    lastPollTime = new Date()

    // Check for auto-send first round emails
    if (result.newBills > 0 && await shouldAutoSendFirstRoundEmails()) {
      // This would be implemented in Phase 3 when email notifications are fully integrated
      console.log(`Auto-send enabled: Would send first round emails for ${result.newBills} new bills`)
    }

    result.success = result.errors.length === 0
    pollErrors = result.errors

    console.log(`[${new Date().toISOString()}] Poll complete. Processed: ${result.billsProcessed}, New: ${result.newBills}`)
  } catch (error) {
    const errorMessage = `Poll failed: ${error}`
    result.errors.push(errorMessage)
    pollErrors = result.errors
    console.error(`[${new Date().toISOString()}] ${errorMessage}`)
  }

  return result
}

/**
 * Start the polling service
 */
export async function startPolling(): Promise<void> {
  if (isPolling) {
    console.log('Polling service is already running')
    return
  }

  const intervalMinutes = await getPollingInterval()
  const intervalMs = intervalMinutes * 60 * 1000

  console.log(`Starting polling service with ${intervalMinutes} minute interval`)

  // Execute first poll immediately
  await executePoll()

  // Set up recurring poll
  pollingIntervalId = setInterval(async () => {
    await executePoll()
  }, intervalMs)

  isPolling = true
}

/**
 * Stop the polling service
 */
export function stopPolling(): void {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId)
    pollingIntervalId = null
  }
  isPolling = false
  console.log('Polling service stopped')
}

/**
 * Restart polling (e.g., after interval change)
 */
export async function restartPolling(): Promise<void> {
  stopPolling()
  await startPolling()
}

/**
 * Get polling status
 */
export function getPollingStatus(): {
  isActive: boolean
  lastPollTime: Date | null
  errors: string[]
} {
  return {
    isActive: isPolling,
    lastPollTime,
    errors: pollErrors,
  }
}

/**
 * Manual refresh trigger
 */
export async function manualRefresh(): Promise<{
  success: boolean
  billsProcessed: number
  newBills: number
  errors: string[]
}> {
  console.log('Manual refresh triggered')
  return executePoll()
}

// ===========================================
// Full Sync (Users + Bills)
// ===========================================

/**
 * Perform a full sync of users and bills
 */
export async function performFullSync(): Promise<{
  success: boolean
  users: { processed: number; created: number; updated: number };
  bills: { processed: number; created: number; updated: number };
  errors: string[]
}> {
  const result = {
    success: false,
    users: { processed: 0, created: 0, updated: 0 },
    bills: { processed: 0, created: 0, updated: 0 },
    errors: [] as string[],
  }

  console.log(`[${new Date().toISOString()}] Starting full sync...`)

  try {
    // Get a Clio client
    const user = await prisma.user.findFirst({
      where: {
        accessToken: { not: null },
        isActive: true,
      },
    })

    if (!user?.accessToken) {
      throw new Error('No authenticated user available for sync')
    }

    // Import the client dynamically to avoid circular deps
    const { createClioClient } = await import('./clio')
    const clioClient = createClioClient(user.accessToken, user.refreshToken || undefined)

    // Sync users first
    console.log('Syncing users...')
    const usersResult = await syncUsers(clioClient)
    result.users = {
      processed: usersResult.recordsProcessed,
      created: usersResult.recordsCreated,
      updated: usersResult.recordsUpdated,
    }
    result.errors.push(...usersResult.errors)

    // Then sync bills
    console.log('Syncing bills...')
    const billsResult = await syncAwaitingApprovalBills()
    result.bills = {
      processed: billsResult.recordsProcessed,
      created: billsResult.recordsCreated,
      updated: billsResult.recordsUpdated,
    }
    result.errors.push(...billsResult.errors)

    result.success = result.errors.length === 0

    console.log(`[${new Date().toISOString()}] Full sync complete`)
  } catch (error) {
    result.errors.push(`Full sync failed: ${error}`)
    console.error(`[${new Date().toISOString()}] Full sync failed:`, error)
  }

  return result
}

// ===========================================
// Export
// ===========================================

export default {
  executePoll,
  startPolling,
  stopPolling,
  restartPolling,
  getPollingStatus,
  manualRefresh,
  performFullSync,
}
