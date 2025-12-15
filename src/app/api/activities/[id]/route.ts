// ===========================================
// Single Activity API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma, ActionType } from '@prisma/client'
import {
  getCurrentUser,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/auth'
import {
  pushActivityToClio,
  holdActivityInClio,
  deleteActivityInClio,
} from '@/services/sync'

// ===========================================
// GET /api/activities/[id] - Get single activity
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

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        timekeeper: {
          select: { id: true, name: true, email: true },
        },
        bill: {
          select: { id: true, billNumber: true },
        },
      },
    })

    if (!activity) {
      return notFoundResponse('Activity not found')
    }

    return NextResponse.json({ success: true, data: activity })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return serverErrorResponse('Failed to fetch activity')
  }
}

// ===========================================
// PATCH /api/activities/[id] - Update activity
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
    const {
      date,
      timekeeperId,
      activityCategory,
      utbmsTaskCode,
      utbmsActivityCode,
      description,
      quantity,
      rate,
      isBillable,
      approvedByTimekeeper,
      action,
    } = body

    // Get the current activity
    const currentActivity = await prisma.activity.findUnique({
      where: { id: params.id },
    })

    if (!currentActivity) {
      return notFoundResponse('Activity not found')
    }

    // Handle hold action
    if (action === 'hold') {
      const result = await holdActivityInClio(user.id, params.id)

      if (!result.success) {
        return serverErrorResponse(result.error || 'Failed to hold activity')
      }

      // Log the action
      await prisma.approvalAction.create({
        data: {
          billId: currentActivity.billId!,
          activityId: params.id,
          userId: user.id,
          actionType: ActionType.HOLD,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Activity held successfully (removed from bill)',
      })
    }

    // Handle approve action
    if (action === 'approve') {
      const activity = await prisma.activity.update({
        where: { id: params.id },
        data: {
          approvedByTimekeeper: true,
          approvedAt: new Date(),
        },
        include: {
          timekeeper: true,
          bill: true,
        },
      })

      // Log the action
      if (currentActivity.billId) {
        await prisma.approvalAction.create({
          data: {
            billId: currentActivity.billId,
            activityId: params.id,
            userId: user.id,
            actionType: ActionType.APPROVE_ENTRY,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Activity approved',
        data: activity,
      })
    }

    // Handle regular updates
    const updateData: any = {}
    const clioUpdates: any = {}

    if (date !== undefined) {
      updateData.date = new Date(date)
      clioUpdates.date = date
    }
    if (timekeeperId !== undefined) {
      updateData.timekeeperId = timekeeperId
    }
    if (activityCategory !== undefined) {
      updateData.activityCategory = activityCategory
    }
    if (utbmsTaskCode !== undefined) {
      updateData.utbmsTaskCode = utbmsTaskCode
    }
    if (utbmsActivityCode !== undefined) {
      updateData.utbmsActivityCode = utbmsActivityCode
    }
    if (description !== undefined) {
      updateData.description = description
      clioUpdates.note = description
    }
    if (quantity !== undefined) {
      updateData.quantity = new Prisma.Decimal(quantity)
      clioUpdates.quantity = quantity
    }
    if (rate !== undefined) {
      updateData.rate = new Prisma.Decimal(rate)
      clioUpdates.rate = rate
    }
    if (isBillable !== undefined) {
      updateData.isBillable = isBillable
      clioUpdates.non_billable = !isBillable
    }
    if (approvedByTimekeeper !== undefined) {
      updateData.approvedByTimekeeper = approvedByTimekeeper
      if (approvedByTimekeeper) {
        updateData.approvedAt = new Date()
      }
    }

    // Recalculate total if quantity or rate changed
    if (quantity !== undefined || rate !== undefined) {
      const newQuantity = quantity ?? Number(currentActivity.quantity ?? 0)
      const newRate = rate ?? Number(currentActivity.rate ?? 0)
      updateData.total = new Prisma.Decimal(newQuantity * newRate)
    }

    // Push changes to Clio if there are Clio-related updates
    if (Object.keys(clioUpdates).length > 0) {
      const clioResult = await pushActivityToClio(user.id, params.id, clioUpdates)

      if (!clioResult.success) {
        // Log warning but continue with local update
        console.warn(`Clio sync failed for activity ${params.id}: ${clioResult.error}`)
      }
    }

    // Create edit history records for changed fields
    const changedFields = Object.keys(updateData)
    for (const field of changedFields) {
      const oldValue = (currentActivity as any)[field]
      const newValue = updateData[field]

      if (String(oldValue) !== String(newValue)) {
        await prisma.activityEdit.create({
          data: {
            activityId: params.id,
            editedById: user.id,
            fieldName: field,
            oldValue: String(oldValue ?? ''),
            newValue: String(newValue ?? ''),
          },
        })
      }
    }

    // Log the edit action
    if (currentActivity.billId && changedFields.length > 0) {
      await prisma.approvalAction.create({
        data: {
          billId: currentActivity.billId,
          activityId: params.id,
          userId: user.id,
          actionType: ActionType.EDIT,
          notes: `Updated fields: ${changedFields.join(', ')}`,
        },
      })
    }

    // Update local database
    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: updateData,
      include: {
        timekeeper: {
          select: { id: true, name: true, email: true },
        },
        bill: {
          select: { id: true, billNumber: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: activity })
  } catch (error) {
    console.error('Error updating activity:', error)
    return serverErrorResponse('Failed to update activity')
  }
}

// ===========================================
// DELETE /api/activities/[id] - Delete activity
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

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
    })

    if (!activity) {
      return notFoundResponse('Activity not found')
    }

    // Delete in Clio
    const result = await deleteActivityInClio(user.id, params.id)

    if (!result.success) {
      return serverErrorResponse(result.error || 'Failed to delete activity')
    }

    // Log the action
    if (activity.billId) {
      await prisma.approvalAction.create({
        data: {
          billId: activity.billId,
          activityId: params.id,
          userId: user.id,
          actionType: ActionType.DELETE,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return serverErrorResponse('Failed to delete activity')
  }
}
