// ===========================================
// Single Bill API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/auth'
import {
  approveBillInClio,
  voidBillInClio,
} from '@/services/sync'
import { WorkflowStatus, ActionType } from '@prisma/client'

// ===========================================
// GET /api/bills/[id] - Get single bill
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        matter: {
          include: {
            client: true,
            responsibleAttorney: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        client: true,
        activities: {
          where: { status: 'ACTIVE' },
          include: {
            timekeeper: {
              select: { id: true, name: true, email: true, clioId: true },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!bill) {
      return notFoundResponse('Bill not found')
    }

    // Compute additional stats
    const totalActivities = bill.activities.length
    const approvedActivities = bill.activities.filter(a => a.approvedByTimekeeper).length

    // Get unique timekeepers with their approval status
    const timekeeperMap = new Map<string, { id: string; name: string; approved: boolean; total: number; email: string }>()

    for (const activity of bill.activities) {
      if (activity.timekeeperId && activity.timekeeper) {
        const existing = timekeeperMap.get(activity.timekeeperId)
        if (existing) {
          existing.total++
          if (!activity.approvedByTimekeeper) {
            existing.approved = false
          }
        } else {
          timekeeperMap.set(activity.timekeeperId, {
            id: activity.timekeeperId,
            name: activity.timekeeper.name,
            email: activity.timekeeper.email,
            approved: activity.approvedByTimekeeper,
            total: 1,
          })
        }
      }
    }

    const timekeepers = Array.from(timekeeperMap.values())

    return NextResponse.json({
      success: true,
      data: {
        ...bill,
        totalActivities,
        approvedActivities,
        allActivitiesApproved: totalActivities > 0 && approvedActivities === totalActivities,
        timekeepers,
      },
    })
  } catch (error) {
    console.error('Error fetching bill:', error)
    return serverErrorResponse('Failed to fetch bill')
  }
}

// ===========================================
// PATCH /api/bills/[id] - Update bill
// ===========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { workflowStatus, skipFirstRound, action } = body

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: { id: params.id },
    })

    if (!existingBill) {
      return notFoundResponse('Bill not found')
    }

    // Handle specific actions
    if (action === 'approve') {
      // Approve bill in Clio
      const result = await approveBillInClio(user.id, params.id)

      if (!result.success) {
        return serverErrorResponse(result.error || 'Failed to approve bill')
      }

      // Log the action
      await prisma.approvalAction.create({
        data: {
          billId: params.id,
          userId: user.id,
          actionType: ActionType.APPROVE_BILL,
        },
      })

      const updatedBill = await prisma.bill.findUnique({
        where: { id: params.id },
        include: {
          client: true,
          matter: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Bill approved successfully',
        data: updatedBill,
      })
    }

    if (action === 'void') {
      // Void bill in Clio
      const result = await voidBillInClio(user.id, params.id)

      if (!result.success) {
        return serverErrorResponse(result.error || 'Failed to void bill')
      }

      // Log the action
      await prisma.approvalAction.create({
        data: {
          billId: params.id,
          userId: user.id,
          actionType: ActionType.VOID,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Bill voided successfully',
      })
    }

    // Handle status updates
    const updateData: any = {}

    if (workflowStatus) {
      updateData.workflowStatus = workflowStatus

      // Update workflow timestamps based on status
      const now = new Date()
      switch (workflowStatus) {
        case 'FIRST_ROUND':
          updateData.firstRoundStartedAt = now
          break
        case 'SECOND_ROUND':
          updateData.firstRoundCompletedAt = now
          updateData.secondRoundStartedAt = now
          break
        case 'APPROVED':
          updateData.secondRoundCompletedAt = now
          updateData.approvedAt = now
          break
        case 'SENT':
          updateData.sentToClientAt = now
          break
      }
    }

    if (skipFirstRound !== undefined) {
      updateData.skipFirstRound = skipFirstRound

      // If skipping first round and bill is pending, move to second round
      if (skipFirstRound && existingBill.workflowStatus === 'PENDING') {
        updateData.workflowStatus = WorkflowStatus.SECOND_ROUND
        updateData.secondRoundStartedAt = new Date()
      }
    }

    const bill = await prisma.bill.update({
      where: { id: params.id },
      data: updateData,
      include: {
        matter: {
          include: {
            client: true,
            responsibleAttorney: true,
          },
        },
        client: true,
      },
    })

    return NextResponse.json({ success: true, data: bill })
  } catch (error) {
    console.error('Error updating bill:', error)
    return serverErrorResponse('Failed to update bill')
  }
}

// ===========================================
// DELETE /api/bills/[id] - Void bill
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: { id: params.id },
    })

    if (!existingBill) {
      return notFoundResponse('Bill not found')
    }

    // Void bill in Clio
    const result = await voidBillInClio(user.id, params.id)

    if (!result.success) {
      return serverErrorResponse(result.error || 'Failed to void bill')
    }

    // Log the action
    await prisma.approvalAction.create({
      data: {
        billId: params.id,
        userId: user.id,
        actionType: ActionType.VOID,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Bill voided successfully',
    })
  } catch (error) {
    console.error('Error voiding bill:', error)
    return serverErrorResponse('Failed to void bill')
  }
}
