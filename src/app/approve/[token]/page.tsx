'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActivitiesTable } from '@/components/activities/activities-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import type { Activity } from '@/types'

// Mock data - will be replaced with actual API calls in Phase 2
const mockBill = {
  id: '1',
  billNumber: 'INV-2024-001',
  clientName: 'Acme Corp',
  matterNumber: 'M-2024-001',
  matterDescription: 'Contract Dispute Resolution',
  totalServices: 5000,
  totalExpenses: 250,
  totalAmount: 5250,
  issueDate: new Date('2024-01-15'),
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
]

type ApprovalStatus = 'loading' | 'valid' | 'expired' | 'used' | 'error'

export default function ApprovePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<ApprovalStatus>('loading')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  useEffect(() => {
    // Validate token in Phase 2
    // For now, simulate loading
    const timer = setTimeout(() => {
      setStatus('valid')
    }, 1000)

    return () => clearTimeout(timer)
  }, [params.token])

  const handleApprove = async () => {
    setIsSubmitting(true)
    // Will call API in Phase 2
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsApproved(true)
    setIsSubmitting(false)
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-gray-500">Validating approval link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-4 text-xl font-semibold">Link Expired</h2>
            <p className="mt-2 text-gray-500">
              This approval link has expired. Please contact your administrator
              for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">Already Approved</h2>
            <p className="mt-2 text-gray-500">
              This invoice has already been approved. No further action is required.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold">Invalid Link</h2>
            <p className="mt-2 text-gray-500">
              This approval link is invalid. Please check the link or contact
              your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">Approved!</h2>
            <p className="mt-2 text-gray-500">
              Thank you for approving invoice {mockBill.billNumber}.
            </p>
            <p className="mt-4 text-sm text-gray-400">
              You may close this window.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-1 text-gray-500">Invoice Approval</p>
        </div>

        {/* Bill Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice {mockBill.billNumber}</CardTitle>
                <CardDescription>
                  {mockBill.clientName} - {mockBill.matterDescription}
                </CardDescription>
              </div>
              <Badge variant="firstRound">Awaiting Your Approval</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="font-medium text-gray-500">Matter</dt>
                <dd className="mt-1">{mockBill.matterNumber}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Issue Date</dt>
                <dd className="mt-1">{formatDate(mockBill.issueDate)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Services</dt>
                <dd className="mt-1">{formatCurrency(mockBill.totalServices)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Total</dt>
                <dd className="mt-1 font-bold">{formatCurrency(mockBill.totalAmount)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Activities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Time Entries</CardTitle>
            <CardDescription>
              Review your time entries and expenses on this invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivitiesTable
              activities={mockActivities}
              showApprovalStatus
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-gray-500">
                By clicking &quot;Approve&quot;, you confirm that the time entries
                above are accurate.
              </p>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Invoice
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          If you have questions about this invoice, please contact your
          administrator.
        </p>
      </div>
    </div>
  )
}
