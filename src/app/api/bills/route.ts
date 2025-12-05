import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { BillFilters } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const matterId = searchParams.get('matterId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')

    // Build where clause
    const where: any = {}

    if (status) {
      where.workflowStatus = status
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
        { matter: { displayNumber: { contains: search, mode: 'insensitive' } } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get total count
    const total = await prisma.bill.count({ where })

    // Get bills with pagination
    const bills = await prisma.bill.findMany({
      where,
      include: {
        matter: {
          include: {
            client: true,
            responsibleAttorney: true,
          },
        },
        client: true,
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      success: true,
      data: bills,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}
