// ===========================================
// Application Constants
// ===========================================

// App Info
export const APP_NAME = 'Gette Law Invoice System'
export const APP_VERSION = '0.1.0'

// Clio OAuth
export const CLIO_AUTH_URL = 'https://app.clio.com/oauth/authorize'
export const CLIO_TOKEN_URL = 'https://app.clio.com/oauth/token'
export const CLIO_API_BASE = 'https://app.clio.com/api/v4'

// OAuth Scopes required for this application
export const CLIO_SCOPES = [
  'bills:read',
  'bills:write',
  'activities:read',
  'activities:write',
  'matters:read',
  'contacts:read',
  'users:read',
].join(' ')

// Workflow Statuses
export const WORKFLOW_STATUSES = {
  PENDING: 'PENDING',
  FIRST_ROUND: 'FIRST_ROUND',
  SECOND_ROUND: 'SECOND_ROUND',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  VOIDED: 'VOIDED',
} as const

// Clio Bill Statuses
export const CLIO_BILL_STATUSES = {
  DRAFT: 'draft',
  AWAITING_APPROVAL: 'awaiting_approval',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAID: 'paid',
  DELETED: 'deleted',
} as const

// Activity Types
export const ACTIVITY_TYPES = {
  TIME_ENTRY: 'TIME_ENTRY',
  EXPENSE: 'EXPENSE',
} as const

// Activity Statuses
export const ACTIVITY_STATUSES = {
  ACTIVE: 'ACTIVE',
  HELD: 'HELD',
  DELETED: 'DELETED',
} as const

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  RESPONSIBLE_ATTORNEY: 'RESPONSIBLE_ATTORNEY',
  TIMEKEEPER: 'TIMEKEEPER',
} as const

// Polling Intervals (in minutes)
export const POLLING_INTERVALS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
]

// Default Settings
export const DEFAULT_SETTINGS = {
  POLLING_INTERVAL_MINUTES: 15,
  AUTO_SEND_FIRST_ROUND_EMAILS: false,
  DEFAULT_SKIP_FIRST_ROUND: false,
  APPROVAL_TOKEN_EXPIRY_HOURS: 72,
}

// Pagination
export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100

// UTBMS Task Codes (common ones)
export const UTBMS_TASK_CODES = [
  { code: 'L100', name: 'Case Assessment, Development and Administration' },
  { code: 'L110', name: 'Fact Investigation/Development' },
  { code: 'L120', name: 'Analysis/Strategy' },
  { code: 'L130', name: 'Experts/Consultants' },
  { code: 'L140', name: 'Document/File Management' },
  { code: 'L150', name: 'Budgeting' },
  { code: 'L160', name: 'Settlement/Non-Binding ADR' },
  { code: 'L190', name: 'Other Case Assessment' },
  { code: 'L200', name: 'Pre-Trial Pleadings and Motions' },
  { code: 'L210', name: 'Pleadings' },
  { code: 'L220', name: 'Preliminary Injunctions/Provisional Remedies' },
  { code: 'L230', name: 'Court Mandated Conferences' },
  { code: 'L240', name: 'Dispositive Motions' },
  { code: 'L250', name: 'Other Written Motions and Submissions' },
  { code: 'L260', name: 'Class Action Certification and Notices' },
  { code: 'L290', name: 'Other Pre-Trial' },
  { code: 'L300', name: 'Discovery' },
  { code: 'L310', name: 'Written Discovery' },
  { code: 'L320', name: 'Document Production' },
  { code: 'L330', name: 'Depositions' },
  { code: 'L340', name: 'Expert Discovery' },
  { code: 'L350', name: 'Discovery Motions' },
  { code: 'L390', name: 'Other Discovery' },
  { code: 'L400', name: 'Trial Preparation and Trial' },
  { code: 'L410', name: 'Fact Witnesses' },
  { code: 'L420', name: 'Expert Witnesses' },
  { code: 'L430', name: 'Written Motions and Submissions' },
  { code: 'L440', name: 'Other Trial Preparation' },
  { code: 'L450', name: 'Trial and Hearing Attendance' },
  { code: 'L460', name: 'Post-Trial Motions and Submissions' },
  { code: 'L490', name: 'Other Trial' },
  { code: 'L500', name: 'Appeal' },
  { code: 'L510', name: 'Appellate Proceedings' },
  { code: 'L520', name: 'Briefs' },
  { code: 'L530', name: 'Oral Argument' },
  { code: 'L590', name: 'Other Appeal' },
]

// UTBMS Expense Codes (common ones)
export const UTBMS_EXPENSE_CODES = [
  { code: 'E101', name: 'Copying/Reproduction' },
  { code: 'E102', name: 'Outside Printing' },
  { code: 'E103', name: 'Word Processing' },
  { code: 'E104', name: 'Facsimile' },
  { code: 'E105', name: 'Telephone' },
  { code: 'E106', name: 'Online Research' },
  { code: 'E107', name: 'Delivery/Messenger Services' },
  { code: 'E108', name: 'Postage' },
  { code: 'E109', name: 'Local Travel' },
  { code: 'E110', name: 'Out of Town Travel' },
  { code: 'E111', name: 'Meals' },
  { code: 'E112', name: 'Court Fees' },
  { code: 'E113', name: 'Subpoena Fees' },
  { code: 'E114', name: 'Witness Fees' },
  { code: 'E115', name: 'Deposition Transcripts' },
  { code: 'E116', name: 'Trial Transcripts' },
  { code: 'E117', name: 'Trial Exhibits' },
  { code: 'E118', name: 'Litigation Support' },
  { code: 'E119', name: 'Experts' },
  { code: 'E120', name: 'Private Investigators' },
  { code: 'E121', name: 'Arbitrators/Mediators' },
  { code: 'E122', name: 'Local Counsel' },
  { code: 'E123', name: 'Other Outside Contractors' },
  { code: 'E124', name: 'Other' },
]

// Activity Categories
export const ACTIVITY_CATEGORIES = [
  'Research',
  'Drafting',
  'Review',
  'Communication',
  'Court Appearance',
  'Meeting',
  'Travel',
  'Administrative',
  'Other',
]

// Table Columns for Bills
export const BILL_TABLE_COLUMNS = [
  { key: 'billNumber', label: 'Bill #', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'matter', label: 'Matter', sortable: true },
  { key: 'totalServices', label: 'Time', sortable: true },
  { key: 'totalExpenses', label: 'Expenses', sortable: true },
  { key: 'totalAmount', label: 'Total', sortable: true },
  { key: 'workflowStatus', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]
