// ===========================================
// Bills API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/auth'
import { manualRefresh } from '@/services/polling'
import { WorkflowStatus } from '@prisma/client'
import { ensureDefaultSettings } from '@/lib/auto-seed'

// ===========================================
// GET /api/bills - List all bills
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Ensure default settings exist (auto-seed on first run)
    await ensureDefaultSettings()

    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const status = searchParams.get('status') as WorkflowStatus | null
    const clioStatus = searchParams.get('clioStatus')
    const clientId = searchParams.get('clientId')
    const matterId = searchParams.get('matterId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    // Build where clause
    const where: any = {}

    if (status) {
      where.workflowStatus = status
    }

    if (clioStatus) {
      where.clioStatus = clioStatus
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (matterId) {
      where.matterId = matterId
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { matter: { displayNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get total count
    const total = await prisma.bill.count({ where })

    // Get bills with related data
    const bills = await prisma.bill.findMany({
      where,
      include: {
        client: true,
        matter: {
          include: {
            responsibleAttorney: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        activities: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            approvedByTimekeeper: true,
            timekeeperId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform bills to include computed properties
    const transformedBills = bills.map(bill => {
      const totalActivities = bill.activities.length
      const approvedActivities = bill.activities.filter(a => a.approvedByTimekeeper).length

      // Get unique timekeepers
      const timekeeperIds = Array.from(new Set(bill.activities.map(a => a.timekeeperId).filter(Boolean)))

      return {
        id: bill.id,
        clioId: bill.clioId,
        billNumber: bill.billNumber,
        client: bill.client,
        matter: bill.matter,
        totalServices: bill.totalServices,
        totalExpenses: bill.totalExpenses,
        totalAmount: bill.totalAmount,
        discount: bill.discount,
        issueDate: bill.issueDate,
        dueDate: bill.dueDate,
        clioStatus: bill.clioStatus,
        workflowStatus: bill.workflowStatus,
        skipFirstRound: bill.skipFirstRound,
        firstRoundStartedAt: bill.firstRoundStartedAt,
        firstRoundCompletedAt: bill.firstRoundCompletedAt,
        secondRoundStartedAt: bill.secondRoundStartedAt,
        approvedAt: bill.approvedAt,
        sentToClientAt: bill.sentToClientAt,
        pdfUrl: bill.pdfUrl,
        createdAt: bill.createdAt,
        syncedAt: bill.syncedAt,
        // Computed fields
        totalActivities,
        approvedActivities,
        timekeeperCount: timekeeperIds.length,
        allActivitiesApproved: totalActivities > 0 && approvedActivities === totalActivities,
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedBills,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return serverErrorResponse('Failed to fetch bills')
  }
}

// ===========================================
// POST /api/bills - Actions (refresh, etc.)
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const action = body.action

    if (action === 'refresh') {
      // Trigger manual refresh
      const result = await manualRefresh()

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Sync complete. Processed ${result.billsProcessed} bills, ${result.newBills} new.`
          : 'Sync completed with errors',
        data: result,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in bills POST:', error)
    return serverErrorResponse('Failed to process request')
  }
}
