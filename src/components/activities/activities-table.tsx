'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatHours } from '@/lib/utils'
import { Edit, Trash2, CheckCircle } from 'lucide-react'
import type { Activity } from '@/types'

interface ActivitiesTableProps {
  activities: Activity[]
  onEdit?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
  onApprove?: (activityId: string) => void
  onSelectionChange?: (selectedIds: string[]) => void
  selectable?: boolean
  showApprovalStatus?: boolean
}

export function ActivitiesTable({
  activities,
  onEdit,
  onDelete,
  onApprove,
  onSelectionChange,
  selectable = false,
  showApprovalStatus = false,
}: ActivitiesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? activities.map((a) => a.id) : []
    setSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleSelectOne = (activityId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedIds, activityId]
      : selectedIds.filter((id) => id !== activityId)
    setSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }

  const isAllSelected = activities.length > 0 && selectedIds.length === activities.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < activities.length

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  {...(isSomeSelected && { 'data-state': 'indeterminate' })}
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Timekeeper</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {showApprovalStatus && <TableHead>Approved</TableHead>}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={selectable ? 11 : 10}
                className="h-24 text-center"
              >
                No activities found.
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(activity.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(activity.id, checked as boolean)
                      }
                      aria-label={`Select activity ${activity.id}`}
                    />
                  </TableCell>
                )}
                <TableCell>{formatDate(activity.date)}</TableCell>
                <TableCell>
                  <Badge variant={activity.type === 'TIME_ENTRY' ? 'default' : 'secondary'}>
                    {activity.type === 'TIME_ENTRY' ? 'Time' : 'Expense'}
                  </Badge>
                </TableCell>
                <TableCell>{activity.timekeeper?.name || '-'}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {activity.description || '-'}
                </TableCell>
                <TableCell>{activity.activityCategory || '-'}</TableCell>
                <TableCell className="text-right">
                  {activity.type === 'TIME_ENTRY'
                    ? formatHours(activity.quantity)
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(activity.rate)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(activity.total)}
                </TableCell>
                {showApprovalStatus && (
                  <TableCell>
                    {activity.approvedByTimekeeper ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(activity)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onApprove && !activity.approvedByTimekeeper && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onApprove(activity.id)}
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(activity.id)}
                        title="Delete"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default ActivitiesTable
