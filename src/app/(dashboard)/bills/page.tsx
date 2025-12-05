'use client'

import { useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { BillsTable } from '@/components/bills/bills-table'
import { BillsFilter } from '@/components/bills/bills-filter'
import type { BillSummary, BillFilters } from '@/types'

// Mock data - will be replaced with actual API calls in Phase 2
const mockBills: BillSummary[] = [
  {
    id: '1',
    billNumber: 'INV-2024-001',
    clientName: 'Acme Corp',
    matterNumber: 'M-2024-001',
    totalServices: 5000,
    totalExpenses: 250,
    totalAmount: 5250,
    workflowStatus: 'FIRST_ROUND',
    issueDate: new Date('2024-01-15'),
  },
  {
    id: '2',
    billNumber: 'INV-2024-002',
    clientName: 'Beta Industries',
    matterNumber: 'M-2024-002',
    totalServices: 12500,
    totalExpenses: 1500,
    totalAmount: 14000,
    workflowStatus: 'SECOND_ROUND',
    issueDate: new Date('2024-01-16'),
  },
  {
    id: '3',
    billNumber: 'INV-2024-003',
    clientName: 'Gamma LLC',
    matterNumber: 'M-2024-003',
    totalServices: 8750,
    totalExpenses: 500,
    totalAmount: 9250,
    workflowStatus: 'PENDING',
    issueDate: new Date('2024-01-17'),
  },
  {
    id: '4',
    billNumber: 'INV-2024-004',
    clientName: 'Delta Corp',
    matterNumber: 'M-2024-004',
    totalServices: 3200,
    totalExpenses: 150,
    totalAmount: 3350,
    workflowStatus: 'APPROVED',
    issueDate: new Date('2024-01-18'),
  },
  {
    id: '5',
    billNumber: 'INV-2024-005',
    clientName: 'Epsilon Inc',
    matterNumber: 'M-2024-005',
    totalServices: 15000,
    totalExpenses: 2000,
    totalAmount: 17000,
    workflowStatus: 'SENT',
    issueDate: new Date('2024-01-10'),
  },
]

export default function BillsPage() {
  const [filters, setFilters] = useState<BillFilters>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Will trigger Clio sync in Phase 2
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleFilterChange = (newFilters: BillFilters) => {
    setFilters(newFilters)
    // Will trigger API call in Phase 2
  }

  const handleApprove = (billId: string) => {
    console.log('Approve bill:', billId)
    // Will call API in Phase 2
  }

  const handleVoid = (billId: string) => {
    console.log('Void bill:', billId)
    // Will call API in Phase 2
  }

  const handleSendToClient = (billId: string) => {
    console.log('Send to client:', billId)
    // Will call API in Phase 2
  }

  // Filter bills based on current filters (mock implementation)
  const filteredBills = mockBills.filter((bill) => {
    if (filters.status && bill.workflowStatus !== filters.status) {
      return false
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        bill.billNumber.toLowerCase().includes(search) ||
        bill.clientName.toLowerCase().includes(search) ||
        bill.matterNumber.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col">
      <Header
        title="Bills"
        subtitle="Manage and approve invoices"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <div className="flex-1 space-y-6 p-6">
        <BillsFilter
          onFilterChange={handleFilterChange}
          initialFilters={filters}
        />
        <BillsTable
          bills={filteredBills}
          onApprove={handleApprove}
          onVoid={handleVoid}
          onSendToClient={handleSendToClient}
        />
      </div>
    </div>
  )
}
