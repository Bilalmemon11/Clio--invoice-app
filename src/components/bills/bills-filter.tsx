'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { WORKFLOW_STATUSES } from '@/lib/constants'
import type { BillFilters } from '@/types'

interface BillsFilterProps {
  onFilterChange: (filters: BillFilters) => void
  initialFilters?: BillFilters
}

export function BillsFilter({ onFilterChange, initialFilters }: BillsFilterProps) {
  const [search, setSearch] = useState(initialFilters?.search || '')
  const [status, setStatus] = useState<string>(
    Array.isArray(initialFilters?.status)
      ? initialFilters.status[0] || ''
      : initialFilters?.status || ''
  )

  const handleSearch = () => {
    onFilterChange({
      search: search || undefined,
      status: status as any || undefined,
    })
  }

  const handleClear = () => {
    setSearch('')
    setStatus('')
    onFilterChange({})
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by bill number, client, or matter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyPress}
          className="pl-10"
        />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {Object.entries(WORKFLOW_STATUSES).map(([key, value]) => (
            <SelectItem key={key} value={value}>
              {key.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSearch}>
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
      {(search || status) && (
        <Button variant="ghost" onClick={handleClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}

export default BillsFilter
