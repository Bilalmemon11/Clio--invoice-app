'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ACTIVITY_CATEGORIES, UTBMS_TASK_CODES } from '@/lib/constants'
import type { Activity, ActivityEditPayload } from '@/types'

interface ActivityEditModalProps {
  activity: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (activityId: string, updates: ActivityEditPayload) => void
  isLoading?: boolean
}

export function ActivityEditModal({
  activity,
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: ActivityEditModalProps) {
  const [formData, setFormData] = useState<ActivityEditPayload>({})

  useEffect(() => {
    if (activity) {
      setFormData({
        date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : '',
        description: activity.description || '',
        activityCategory: activity.activityCategory || '',
        utbmsTaskCode: activity.utbmsTaskCode || '',
        quantity: activity.quantity || 0,
        rate: activity.rate || 0,
      })
    }
  }, [activity])

  const handleSave = () => {
    if (activity) {
      onSave(activity.id, formData)
    }
  }

  const handleChange = (field: keyof ActivityEditPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!activity) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Make changes to the activity. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={formData.activityCategory || ''}
              onValueChange={(value) => handleChange('activityCategory', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="utbms" className="text-right">
              UTBMS Code
            </Label>
            <Select
              value={formData.utbmsTaskCode || ''}
              onValueChange={(value) => handleChange('utbmsTaskCode', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select UTBMS code" />
              </SelectTrigger>
              <SelectContent>
                {UTBMS_TASK_CODES.map((code) => (
                  <SelectItem key={code.code} value={code.code}>
                    {code.code} - {code.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activity.type === 'TIME_ENTRY' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Hours
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantity || ''}
                  onChange={(e) =>
                    handleChange('quantity', parseFloat(e.target.value) || 0)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rate" className="text-right">
                  Rate ($)
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rate || ''}
                  onChange={(e) =>
                    handleChange('rate', parseFloat(e.target.value) || 0)
                  }
                  className="col-span-3"
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ActivityEditModal
