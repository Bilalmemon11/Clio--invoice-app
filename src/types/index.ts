// ===========================================
// Clio Invoice App - Type Definitions
// ===========================================

// ===========================================
// USER TYPES
// ===========================================

export type UserRole = 'ADMIN' | 'RESPONSIBLE_ATTORNEY' | 'TIMEKEEPER'

export interface User {
  id: string
  clioId: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  id: string
  email: string
  name: string
  role: UserRole
  accessToken: string
}

// ===========================================
// CLIENT & MATTER TYPES
// ===========================================

export interface Client {
  id: string
  clioId: string
  name: string
  email?: string
  isLedesBilling: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Matter {
  id: string
  clioId: string
  displayNumber?: string
  description?: string
  clientId?: string
  responsibleAttorneyId?: string
  client?: Client
  responsibleAttorney?: User
  createdAt: Date
  updatedAt: Date
}

// ===========================================
// BILL/INVOICE TYPES
// ===========================================

export type WorkflowStatus =
  | 'PENDING'
  | 'FIRST_ROUND'
  | 'SECOND_ROUND'
  | 'APPROVED'
  | 'SENT'
  | 'VOIDED'

export interface Bill {
  id: string
  clioId: string
  billNumber: string
  matterId?: string
  clientId?: string

  // Amounts
  totalServices: number
  totalExpenses: number
  totalAmount: number
  discount: number

  // Dates
  issueDate?: Date
  dueDate?: Date
  billingThroughDate?: Date

  // Status
  clioStatus?: string
  workflowStatus: WorkflowStatus

  // Approval tracking
  firstRoundStartedAt?: Date
  firstRoundCompletedAt?: Date
  secondRoundStartedAt?: Date
  secondRoundCompletedAt?: Date
  approvedAt?: Date
  sentToClientAt?: Date

  // Options
  skipFirstRound: boolean

  // PDF
  pdfUrl?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  syncedAt: Date

  // Relations
  matter?: Matter
  client?: Client
  activities?: Activity[]
}

export interface BillWithDetails extends Bill {
  matter: Matter & {
    client: Client
    responsibleAttorney: User
  }
  activities: Activity[]
  _count?: {
    activities: number
  }
}

export interface BillSummary {
  id: string
  billNumber: string
  clientName: string
  matterNumber: string
  totalServices: number
  totalExpenses: number
  totalAmount: number
  workflowStatus: WorkflowStatus
  issueDate?: Date
}

// ===========================================
// ACTIVITY TYPES
// ===========================================

export type ActivityType = 'TIME_ENTRY' | 'EXPENSE'
export type ActivityStatus = 'ACTIVE' | 'HELD' | 'DELETED'

export interface Activity {
  id: string
  clioId: string
  billId?: string
  type: ActivityType

  // Fields
  date: Date
  timekeeperId?: string
  activityCategory?: string
  utbmsTaskCode?: string
  description?: string
  quantity?: number
  rate?: number
  total?: number
  isBillable: boolean

  // Status
  status: ActivityStatus

  // Approval
  approvedByTimekeeper: boolean
  approvedAt?: Date

  // For expenses
  vendor?: string
  expenseCode?: string
  attachmentUrl?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  syncedAt: Date

  // Relations
  timekeeper?: User
}

export interface ActivityEditPayload {
  date?: string
  timekeeperId?: string
  activityCategory?: string
  utbmsTaskCode?: string
  description?: string
  quantity?: number
  rate?: number
  isBillable?: boolean
}

export interface BulkActivityEditPayload {
  activityIds: string[]
  updates: ActivityEditPayload
}

// ===========================================
// APPROVAL TYPES
// ===========================================

export type ActionType =
  | 'APPROVE_ENTRY'
  | 'APPROVE_BILL'
  | 'SEND_TO_CLIENT'
  | 'VOID'
  | 'HOLD'
  | 'DELETE'
  | 'EDIT'

export interface ApprovalAction {
  id: string
  billId: string
  activityId?: string
  userId: string
  actionType: ActionType
  notes?: string
  createdAt: Date
  user?: User
}

export interface ApprovalToken {
  token: string
  billId: string
  userId: string
  expiresAt: Date
}

// ===========================================
// EMAIL TYPES
// ===========================================

export type NotificationType =
  | 'FIRST_ROUND_REVIEW'
  | 'SECOND_ROUND_REVIEW'
  | 'INVOICE_SENT'
  | 'REMINDER'

export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'OPENED' | 'CLICKED'

export interface EmailNotification {
  id: string
  billId: string
  recipientId?: string
  recipientEmail: string
  notificationType: NotificationType
  sentAt?: Date
  openedAt?: Date
  clickedAt?: Date
  status: EmailStatus
  approvalToken?: string
  tokenExpiresAt?: Date
}

// ===========================================
// SETTINGS TYPES
// ===========================================

export interface AppSettings {
  pollingIntervalMinutes: number
  autoSendFirstRoundEmails: boolean
  defaultSkipFirstRound: boolean
}

export interface Setting {
  id: string
  key: string
  value: string
  description?: string
  updatedAt: Date
}

// ===========================================
// CLIO API TYPES
// ===========================================

export interface ClioOAuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface ClioBill {
  id: number
  etag: string
  number: string
  issued_at: string
  due_at: string
  balance: string
  state: string
  subject?: string
  purchase_order?: string
  sub_total: string
  total: string
  start_at?: string
  end_at?: string
  matter?: {
    id: number
    display_number: string
    description: string
  }
  client?: {
    id: number
    name: string
  }
}

export interface ClioActivity {
  id: number
  etag: string
  type: string
  date: string
  quantity?: number
  rate?: number
  total?: number
  non_billable: boolean
  billed: boolean
  note?: string
  user?: {
    id: number
    name: string
  }
  activity_description?: {
    id: number
    name: string
  }
}

export interface ClioUser {
  id: number
  etag: string
  name: string
  email: string
  enabled: boolean
  type: string
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ===========================================
// FILTER & QUERY TYPES
// ===========================================

export interface BillFilters {
  status?: WorkflowStatus | WorkflowStatus[]
  clientId?: string
  matterId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface ActivityFilters {
  billId?: string
  type?: ActivityType
  status?: ActivityStatus
  timekeeperId?: string
  approvedByTimekeeper?: boolean
}

// ===========================================
// DASHBOARD TYPES
// ===========================================

export interface DashboardStats {
  awaitingApproval: number
  firstRound: number
  secondRound: number
  sent: number
  totalAmount: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  user: string
}
