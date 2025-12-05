import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        timekeeper: true,
        bill: true,
      },
    })

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: activity })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      date,
      timekeeperId,
      activityCategory,
      utbmsTaskCode,
      description,
      quantity,
      rate,
      isBillable,
      approvedByTimekeeper,
    } = body

    // Get the current activity to track changes
    const currentActivity = await prisma.activity.findUnique({
      where: { id: params.id },
    })

    if (!currentActivity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (date !== undefined) updateData.date = new Date(date)
    if (timekeeperId !== undefined) updateData.timekeeperId = timekeeperId
    if (activityCategory !== undefined) updateData.activityCategory = activityCategory
    if (utbmsTaskCode !== undefined) updateData.utbmsTaskCode = utbmsTaskCode
    if (description !== undefined) updateData.description = description
    if (quantity !== undefined) updateData.quantity = quantity
    if (rate !== undefined) updateData.rate = rate
    if (isBillable !== undefined) updateData.isBillable = isBillable
    if (approvedByTimekeeper !== undefined) {
      updateData.approvedByTimekeeper = approvedByTimekeeper
      if (approvedByTimekeeper) {
        updateData.approvedAt = new Date()
      }
    }

    // Recalculate total if quantity or rate changed
    if (quantity !== undefined || rate !== undefined) {
      const newQuantity = quantity ?? currentActivity.quantity ?? 0
      const newRate = rate ?? currentActivity.rate ?? 0
      updateData.total = newQuantity * newRate
    }

    // Create an edit record
    // Note: We'll need the userId from the session in Phase 2
    await prisma.activityEdit.create({
      data: {
        activityId: params.id,
        // userId: will be set from session
        previousValue: JSON.stringify(currentActivity),
        newValue: JSON.stringify({ ...currentActivity, ...updateData }),
        editedAt: new Date(),
      },
    })

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: updateData,
      include: {
        timekeeper: true,
        bill: true,
      },
    })

    return NextResponse.json({ success: true, data: activity })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete - mark as DELETED status
    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        status: 'DELETED',
      },
    })

    return NextResponse.json({ success: true, data: activity })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
