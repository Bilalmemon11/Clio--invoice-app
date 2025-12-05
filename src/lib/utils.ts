import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency value
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD'
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format hours with decimal precision
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '0.0'
  return hours.toFixed(1)
}

/**
 * Get workflow status display info
 */
export function getWorkflowStatusDisplay(status: string): {
  label: string
  className: string
} {
  const statusMap: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'status-pending' },
    FIRST_ROUND: { label: 'First Round', className: 'status-first-round' },
    SECOND_ROUND: { label: 'Second Round', className: 'status-second-round' },
    APPROVED: { label: 'Approved', className: 'status-approved' },
    SENT: { label: 'Sent', className: 'status-sent' },
    VOIDED: { label: 'Voided', className: 'status-voided' },
  }
  return statusMap[status] || { label: status, className: '' }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Generate a random string for tokens
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Parse decimal from Prisma Decimal type
 */
export function parseDecimal(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  if (typeof value.toNumber === 'function') return value.toNumber()
  return 0
}

/**
 * Calculate totals from activities
 */
export function calculateBillTotals(activities: Array<{ total?: number | null; type: string }>) {
  let totalServices = 0
  let totalExpenses = 0

  activities.forEach((activity) => {
    const amount = activity.total || 0
    if (activity.type === 'TIME_ENTRY') {
      totalServices += amount
    } else if (activity.type === 'EXPENSE') {
      totalExpenses += amount
    }
  })

  return {
    totalServices,
    totalExpenses,
    totalAmount: totalServices + totalExpenses,
  }
}
