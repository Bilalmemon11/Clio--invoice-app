// ===========================================
// Clio API Response Types
// ===========================================

// Base response wrapper
export interface ClioApiResponse<T> {
  data: T
  meta?: {
    paging?: {
      next?: string
      previous?: string
    }
    records?: number
  }
}

// ===========================================
// BILLS
// ===========================================

export interface ClioBillResponse {
  id: number
  etag: string
  number: string
  issued_at: string
  created_at: string
  due_at: string
  tax_rate: number
  secondary_tax_rate: number
  updated_at: string
  subject: string | null
  purchase_order: string | null
  type: string
  memo: string | null
  start_at: string | null
  end_at: string | null
  balance: string
  state: string
  kind: string
  total: string
  paid: string
  paid_at: string | null
  pending: string
  due: string
  discount_services_only: string
  can_update: boolean
  credits_issued: string
  shared: boolean
  last_sent_at: string | null
  services_secondary_tax: string
  services_sub_total: string
  services_tax: string
  services_taxable_sub_total: string
  services_secondary_taxable_sub_total: string
  expenses_sub_total: string
  taxable_sub_total: string
  secondary_taxable_sub_total: string
  sub_total: string
  tax_sum: string
  secondary_tax_sum: string
  total_tax: string
  available_state_transitions: string[]
  user?: {
    id: number
    etag: string
    name: string
    first_name: string
    last_name: string
    type: string
    enabled: boolean
  }
  client?: {
    id: number
    etag: string
    name: string
    first_name: string | null
    middle_name: string | null
    last_name: string | null
    type: string
  }
  matter?: {
    id: number
    etag: string
    display_number: string
    description: string
    number: number
    status: string
  }
  originating_attorney?: {
    id: number
    name: string
  }
  responsible_attorney?: {
    id: number
    name: string
  }
  group?: {
    id: number
    name: string
  }
  bill_theme?: {
    id: number
    name: string
  }
  currency?: {
    id: number
    code: string
  }
  discount?: {
    type: string
    rate: number
    note: string | null
  }
  interest?: {
    type: string
    rate: number
  }
}

// ===========================================
// ACTIVITIES (Line Items)
// ===========================================

export interface ClioActivityResponse {
  id: number
  etag: string
  type: string
  date: string
  quantity: number | null
  quantity_in_hours: number | null
  rounded_quantity: number | null
  rounded_quantity_in_hours: number | null
  rate: number | null
  price: number | null
  total: number | null
  non_billable: boolean
  non_billable_total: number | null
  billed: boolean
  on_bill: boolean
  flat_rate: boolean
  note: string | null
  created_at: string
  updated_at: string
  user?: {
    id: number
    etag: string
    name: string
    first_name: string
    last_name: string
    type: string
    enabled: boolean
  }
  matter?: {
    id: number
    display_number: string
    description: string
  }
  activity_description?: {
    id: number
    etag: string
    name: string
    type: string
    utbms_activity?: {
      id: number
      code: string
      name: string
    }
    utbms_task?: {
      id: number
      code: string
      name: string
    }
  }
  expense_category?: {
    id: number
    etag: string
    name: string
    entry_type: string
    utbms_expense?: {
      id: number
      code: string
      name: string
    }
  }
  bill?: {
    id: number
    number: string
  }
  vendor?: {
    id: number
    name: string
  }
}

// ===========================================
// USERS
// ===========================================

export interface ClioUserResponse {
  id: number
  etag: string
  name: string
  first_name: string
  last_name: string
  email: string
  enabled: boolean
  type: string
  created_at: string
  updated_at: string
  subscription_type: string
  default_calendar_id: number | null
  time_zone: string
  avatar?: {
    id: number
    url: string
  }
  co_counsel_rate?: {
    id: number
    amount: number
  }
  rate?: {
    id: number
    amount: number
  }
}

// ===========================================
// CONTACTS (Clients)
// ===========================================

export interface ClioContactResponse {
  id: number
  etag: string
  name: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  date_of_birth: string | null
  type: string
  created_at: string
  updated_at: string
  prefix: string | null
  title: string | null
  initials: string | null
  company?: {
    id: number
    name: string
  }
  primary_email_address?: {
    id: number
    address: string
    name: string
    default_email: boolean
  }
  primary_phone_number?: {
    id: number
    number: string
    name: string
    default_number: boolean
  }
  primary_address?: {
    id: number
    street: string
    city: string
    province: string
    postal_code: string
    country: string
    name: string
  }
  email_addresses?: Array<{
    id: number
    address: string
    name: string
    default_email: boolean
  }>
  phone_numbers?: Array<{
    id: number
    number: string
    name: string
    default_number: boolean
  }>
  addresses?: Array<{
    id: number
    street: string
    city: string
    province: string
    postal_code: string
    country: string
    name: string
  }>
  custom_field_values?: Array<{
    id: number
    value: string
    custom_field: {
      id: number
      name: string
      field_type: string
    }
  }>
}

// ===========================================
// MATTERS
// ===========================================

export interface ClioMatterResponse {
  id: number
  etag: string
  number: number
  display_number: string
  description: string
  status: string
  created_at: string
  updated_at: string
  open_date: string | null
  close_date: string | null
  pending_date: string | null
  billable: boolean
  maildrop_address: string | null
  client?: {
    id: number
    name: string
    type: string
  }
  responsible_attorney?: {
    id: number
    name: string
  }
  originating_attorney?: {
    id: number
    name: string
  }
  practice_area?: {
    id: number
    name: string
  }
  group?: {
    id: number
    name: string
  }
  custom_field_values?: Array<{
    id: number
    value: string
    custom_field: {
      id: number
      name: string
      field_type: string
    }
  }>
}

// ===========================================
// CUSTOM FIELDS
// ===========================================

export interface ClioCustomFieldResponse {
  id: number
  etag: string
  name: string
  parent_type: string
  field_type: string
  displayed: boolean
  required: boolean
  picklist_options?: Array<{
    id: number
    option: string
  }>
}

// ===========================================
// LINE ITEMS (for Bill details)
// ===========================================

export interface ClioLineItemResponse {
  id: number
  etag: string
  type: string
  kind: string
  date: string
  description: string
  quantity: number | null
  price: number | null
  total: number
  secondary_tax: number
  secondary_taxable: boolean
  tax: number
  taxable: boolean
  included_line_item_ids: number[]
  group: string | null
  discount_visible: boolean
  group_ordering: number
  bill?: {
    id: number
    number: string
  }
  activity?: {
    id: number
    type: string
  }
  user?: {
    id: number
    name: string
  }
}

// ===========================================
// UTBMS CODES
// ===========================================

export interface ClioUtbmsCodeResponse {
  id: number
  code: string
  name: string
  type: string
}
