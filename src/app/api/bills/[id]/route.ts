import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        matter: {
          include: {
            client: true,
            responsibleAttorney: true,
          },
        },
        client: true,
        activities: {
          include: {
            timekeeper: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: bill })
  } catch (error) {
    console.error('Error fetching bill:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bill' },
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
    const { workflowStatus, skipFirstRound } = body

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
        case 'VOIDED':
          // No additional timestamps needed
          break
      }
    }

    if (skipFirstRound !== undefined) {
      updateData.skipFirstRound = skipFirstRound
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
    return NextResponse.json(
      { success: false, error: 'Failed to update bill' },
      { status: 500 }
    )
  }
}
