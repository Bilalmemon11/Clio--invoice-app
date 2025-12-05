'use client'

import { Header } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { BillsTable } from '@/components/bills/bills-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats, BillSummary } from '@/types'

// Mock data - will be replaced with actual API calls in Phase 2
const mockStats: DashboardStats = {
  awaitingApproval: 12,
  firstRound: 5,
  secondRound: 3,
  sent: 45,
  totalAmount: 125750.00,
}

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
]

export default function DashboardPage() {
  const handleRefresh = () => {
    // Will trigger Clio sync in Phase 2
    console.log('Syncing with Clio...')
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        subtitle="Overview of your invoice workflow"
        onRefresh={handleRefresh}
      />
      <div className="flex-1 space-y-6 p-6">
        <StatsCards stats={mockStats} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bills Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <BillsTable bills={mockBills.slice(0, 5)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="flex-1">Bill INV-2024-001 approved by John Doe</span>
                  <span className="text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="flex-1">New bill INV-2024-003 imported from Clio</span>
                  <span className="text-gray-500">4 hours ago</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="flex-1">Email reminder sent for INV-2024-002</span>
                  <span className="text-gray-500">6 hours ago</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="flex-1">Bill INV-2024-004 sent to client</span>
                  <span className="text-gray-500">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
