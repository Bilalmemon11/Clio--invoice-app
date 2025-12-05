'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, getWorkflowStatusDisplay } from '@/lib/utils'
import { MoreHorizontal, Eye, CheckCircle, XCircle, Send } from 'lucide-react'
import type { BillSummary, WorkflowStatus } from '@/types'

interface BillsTableProps {
  bills: BillSummary[]
  onApprove?: (billId: string) => void
  onVoid?: (billId: string) => void
  onSendToClient?: (billId: string) => void
}

const statusVariantMap: Record<WorkflowStatus, 'pending' | 'firstRound' | 'secondRound' | 'approved' | 'sent' | 'voided'> = {
  PENDING: 'pending',
  FIRST_ROUND: 'firstRound',
  SECOND_ROUND: 'secondRound',
  APPROVED: 'approved',
  SENT: 'sent',
  VOIDED: 'voided',
}

export function BillsTable({ bills, onApprove, onVoid, onSendToClient }: BillsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Matter</TableHead>
            <TableHead className="text-right">Time</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No bills found.
              </TableCell>
            </TableRow>
          ) : (
            bills.map((bill) => {
              const statusDisplay = getWorkflowStatusDisplay(bill.workflowStatus)
              return (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/bills/${bill.id}`}
                      className="text-primary hover:underline"
                    >
                      {bill.billNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{bill.clientName}</TableCell>
                  <TableCell>{bill.matterNumber}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(bill.totalServices)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(bill.totalExpenses)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(bill.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[bill.workflowStatus]}>
                      {statusDisplay.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(bill.issueDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/bills/${bill.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {bill.workflowStatus !== 'SENT' && bill.workflowStatus !== 'VOIDED' && (
                          <>
                            {onApprove && (
                              <DropdownMenuItem onClick={() => onApprove(bill.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {onSendToClient && bill.workflowStatus === 'APPROVED' && (
                              <DropdownMenuItem onClick={() => onSendToClient(bill.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send to Client
                              </DropdownMenuItem>
                            )}
                            {onVoid && (
                              <DropdownMenuItem
                                onClick={() => onVoid(bill.id)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Void Bill
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default BillsTable
