'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/dashboard/header'
import { ActivitiesTable } from '@/components/activities/activities-table'
import { ActivityEditModal } from '@/components/activities/activity-edit-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getWorkflowStatusDisplay } from '@/lib/utils'
import { ArrowLeft, CheckCircle, XCircle, Send, Edit } from 'lucide-react'
import type { Activity, ActivityEditPayload, WorkflowStatus } from '@/types'

// Mock data - will be replaced with actual API calls in Phase 2
const mockBill = {
  id: '1',
  billNumber: 'INV-2024-001',
  clientName: 'Acme Corp',
  matterNumber: 'M-2024-001',
  matterDescription: 'Contract Dispute Resolution',
  responsibleAttorney: 'Jane Smith',
  totalServices: 5000,
  totalExpenses: 250,
  totalAmount: 5250,
  discount: 0,
  workflowStatus: 'FIRST_ROUND' as WorkflowStatus,
  issueDate: new Date('2024-01-15'),
  dueDate: new Date('2024-02-15'),
  clioStatus: 'awaiting_approval',
}

const mockActivities: Activity[] = [
  {
    id: '1',
    clioId: '101',
    billId: '1',
    type: 'TIME_ENTRY',
    date: new Date('2024-01-10'),
    timekeeperId: '1',
    timekeeper: { id: '1', clioId: '1', email: 'john@gettelaw.com', name: 'John Doe', role: 'TIMEKEEPER', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    activityCategory: 'Research',
    utbmsTaskCode: 'L110',
    description: 'Legal research on contract law precedents',
    quantity: 2.5,
    rate: 350,
    total: 875,
    isBillable: true,
    status: 'ACTIVE',
    approvedByTimekeeper: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: new Date(),
  },
  {
    id: '2',
    clioId: '102',
    billId: '1',
    type: 'TIME_ENTRY',
    date: new Date('2024-01-11'),
    timekeeperId: '1',
    timekeeper: { id: '1', clioId: '1', email: 'john@gettelaw.com', name: 'John Doe', role: 'TIMEKEEPER', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    activityCategory: 'Drafting',
    utbmsTaskCode: 'L210',
    description: 'Draft response to motion',
    quantity: 4.0,
    rate: 350,
    total: 1400,
    isBillable: true,
    status: 'ACTIVE',
    approvedByTimekeeper: true,
    approvedAt: new Date('2024-01-12'),
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: new Date(),
  },
  {
    id: '3',
    clioId: '103',
    billId: '1',
    type: 'EXPENSE',
    date: new Date('2024-01-12'),
    description: 'Court filing fees',
    total: 250,
    isBillable: true,
    status: 'ACTIVE',
    approvedByTimekeeper: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: new Date(),
  },
]

const statusVariantMap: Record<WorkflowStatus, 'pending' | 'firstRound' | 'secondRound' | 'approved' | 'sent' | 'voided'> = {
  PENDING: 'pending',
  FIRST_ROUND: 'firstRound',
  SECOND_ROUND: 'secondRound',
  APPROVED: 'approved',
  SENT: 'sent',
  VOIDED: 'voided',
}

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([])

  const statusDisplay = getWorkflowStatusDisplay(mockBill.workflowStatus)

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleSaveActivity = (activityId: string, updates: ActivityEditPayload) => {
    console.log('Save activity:', activityId, updates)
    // Will call API in Phase 2
    setIsEditModalOpen(false)
  }

  const handleDeleteActivity = (activityId: string) => {
    console.log('Delete activity:', activityId)
    // Will call API in Phase 2
  }

  const handleApproveActivity = (activityId: string) => {
    console.log('Approve activity:', activityId)
    // Will call API in Phase 2
  }

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedActivityIds(selectedIds)
  }

  const handleApproveBill = () => {
    console.log('Approve bill:', params.id)
    // Will call API in Phase 2
  }

  const handleVoidBill = () => {
    console.log('Void bill:', params.id)
    // Will call API in Phase 2
  }

  const handleSendToClient = () => {
    console.log('Send to client:', params.id)
    // Will call API in Phase 2
  }

  return (
    <div className="flex flex-col">
      <Header
        title={`Bill ${mockBill.billNumber}`}
        subtitle={`${mockBill.clientName} - ${mockBill.matterDescription}`}
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Back button */}
        <Link
          href="/bills"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bills
        </Link>

        {/* Bill Summary */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bill Details</CardTitle>
                <Badge variant={statusVariantMap[mockBill.workflowStatus]}>
                  {statusDisplay.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Bill Number</dt>
                  <dd className="mt-1">{mockBill.billNumber}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Client</dt>
                  <dd className="mt-1">{mockBill.clientName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Matter</dt>
                  <dd className="mt-1">{mockBill.matterNumber}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Responsible Attorney</dt>
                  <dd className="mt-1">{mockBill.responsibleAttorney}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Issue Date</dt>
                  <dd className="mt-1">{formatDate(mockBill.issueDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Due Date</dt>
                  <dd className="mt-1">{formatDate(mockBill.dueDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Clio Status</dt>
                  <dd className="mt-1 capitalize">{mockBill.clioStatus.replace(/_/g, ' ')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Services</dt>
                  <dd className="font-medium">{formatCurrency(mockBill.totalServices)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Expenses</dt>
                  <dd className="font-medium">{formatCurrency(mockBill.totalExpenses)}</dd>
                </div>
                {mockBill.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <dt>Discount</dt>
                    <dd className="font-medium">-{formatCurrency(mockBill.discount)}</dd>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <dt>Total</dt>
                    <dd>{formatCurrency(mockBill.totalAmount)}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 space-y-2">
                {mockBill.workflowStatus !== 'SENT' && mockBill.workflowStatus !== 'VOIDED' && (
                  <>
                    <Button onClick={handleApproveBill} className="w-full">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Bill
                    </Button>
                    {mockBill.workflowStatus === 'APPROVED' && (
                      <Button onClick={handleSendToClient} variant="outline" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Send to Client
                      </Button>
                    )}
                    <Button onClick={handleVoidBill} variant="destructive" className="w-full">
                      <XCircle className="mr-2 h-4 w-4" />
                      Void Bill
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activities</CardTitle>
              {selectedActivityIds.length > 0 && (
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Mass Edit ({selectedActivityIds.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ActivitiesTable
              activities={mockActivities}
              onEdit={handleEditActivity}
              onDelete={handleDeleteActivity}
              onApprove={handleApproveActivity}
              onSelectionChange={handleSelectionChange}
              selectable
              showApprovalStatus
            />
          </CardContent>
        </Card>
      </div>

      <ActivityEditModal
        activity={editingActivity}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveActivity}
      />
    </div>
  )
}
