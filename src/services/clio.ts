// ===========================================
// Clio API Client Service
// ===========================================

import { CLIO_API_BASE, CLIO_AUTH_URL, CLIO_TOKEN_URL, CLIO_SCOPES } from '@/lib/constants'
import type {
  ClioApiResponse,
  ClioBillResponse,
  ClioActivityResponse,
  ClioUserResponse,
  ClioContactResponse,
  ClioMatterResponse,
  ClioLineItemResponse,
} from '@/types/clio'

// Environment variables
const CLIO_CLIENT_ID = process.env.CLIO_CLIENT_ID || ''
const CLIO_CLIENT_SECRET = process.env.CLIO_CLIENT_SECRET || ''
const CLIO_REDIRECT_URI = process.env.CLIO_REDIRECT_URL || 'http://localhost:3000/api/auth/clio/callback'

// Rate limiting configuration
const RATE_LIMIT_REQUESTS_PER_SECOND = 4 // Clio allows ~5/sec, we use 4 to be safe
const RATE_LIMIT_DELAY_MS = 1000 / RATE_LIMIT_REQUESTS_PER_SECOND
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface TokenUpdateCallback {
  (accessToken: string, refreshToken: string, expiresAt: Date): Promise<void>
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Clio API Client
 * Handles all interactions with the Clio API with rate limiting and retry logic
 */
export class ClioClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: Date | null = null
  private lastRequestTime: number = 0
  private onTokenUpdate: TokenUpdateCallback | null = null

  constructor(accessToken?: string, refreshToken?: string, onTokenUpdate?: TokenUpdateCallback) {
    this.accessToken = accessToken || null
    this.refreshToken = refreshToken || null
    this.onTokenUpdate = onTokenUpdate || null
  }

  // ===========================================
  // OAuth Methods
  // ===========================================

  /**
   * Generate the OAuth authorization URL
   */
  static getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIO_CLIENT_ID,
      redirect_uri: CLIO_REDIRECT_URI,
      scope: CLIO_SCOPES,
    })
    if (state) {
      params.set('state', state)
    }
    return `${CLIO_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await fetch(CLIO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: CLIO_CLIENT_ID,
        client_secret: CLIO_CLIENT_SECRET,
        redirect_uri: CLIO_REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for token: ${error}`)
    }

    return response.json()
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken(): Promise<TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(CLIO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: CLIO_CLIENT_ID,
        client_secret: CLIO_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh token: ${error}`)
    }

    const tokens = await response.json()
    this.accessToken = tokens.access_token
    this.refreshToken = tokens.refresh_token
    this.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

    // Call the token update callback if provided
    if (this.onTokenUpdate) {
      await this.onTokenUpdate(
        tokens.access_token,
        tokens.refresh_token,
        this.tokenExpiry
      )
    }

    return tokens
  }

  /**
   * Check if the access token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return false
    // Consider token expired if it expires in less than 5 minutes
    return this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000
  }

  // ===========================================
  // Rate Limiting
  // ===========================================

  /**
   * Apply rate limiting before making a request
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
      await sleep(RATE_LIMIT_DELAY_MS - timeSinceLastRequest)
    }

    this.lastRequestTime = Date.now()
  }

  // ===========================================
  // HTTP Methods with Retry Logic
  // ===========================================

  /**
   * Make an authenticated request to the Clio API with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    // Check if token needs refresh
    if (this.isTokenExpired()) {
      await this.refreshAccessToken()
    }

    // Apply rate limiting
    await this.applyRateLimit()

    const url = `${CLIO_API_BASE}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * (retryCount + 1)

        console.warn(`Rate limited by Clio API. Waiting ${waitTime}ms before retry.`)
        await sleep(waitTime)

        if (retryCount < MAX_RETRIES) {
          return this.request(endpoint, options, retryCount + 1)
        }
        throw new Error('Rate limit exceeded after maximum retries')
      }

      // Handle token expiration (401)
      if (response.status === 401) {
        console.warn('Token expired. Refreshing...')
        await this.refreshAccessToken()

        if (retryCount < MAX_RETRIES) {
          return this.request(endpoint, options, retryCount + 1)
        }
        throw new Error('Authentication failed after token refresh')
      }

      // Handle server errors (5xx) with retry
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.warn(`Server error ${response.status}. Retrying in ${RETRY_DELAY_MS}ms...`)
        await sleep(RETRY_DELAY_MS * (retryCount + 1))
        return this.request(endpoint, options, retryCount + 1)
      }

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Clio API error: ${response.status} - ${error}`)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      return response.json()
    } catch (error) {
      // Retry on network errors
      if (error instanceof TypeError && error.message.includes('fetch') && retryCount < MAX_RETRIES) {
        console.warn(`Network error. Retrying in ${RETRY_DELAY_MS}ms...`)
        await sleep(RETRY_DELAY_MS * (retryCount + 1))
        return this.request(endpoint, options, retryCount + 1)
      }
      throw error
    }
  }

  // ===========================================
  // Pagination Helper
  // ===========================================

  /**
   * Fetch all pages of a paginated endpoint
   */
  async fetchAllPages<T>(
    endpoint: string,
    params: URLSearchParams = new URLSearchParams()
  ): Promise<T[]> {
    const allData: T[] = []
    let pageToken: string | null = null

    do {
      if (pageToken) {
        params.set('page_token', pageToken)
      }

      const response = await this.request<ClioApiResponse<T[]>>(
        `${endpoint}?${params.toString()}`
      )

      if (response.data) {
        allData.push(...response.data)
      }

      pageToken = response.meta?.paging?.next || null
    } while (pageToken)

    return allData
  }

  // ===========================================
  // Bills
  // ===========================================

  /**
   * Get bills with optional filters
   */
  async getBills(params?: {
    state?: string
    client_id?: number
    matter_id?: number
    updated_since?: string
    limit?: number
    page_token?: string
  }): Promise<ClioApiResponse<ClioBillResponse[]>> {
    const searchParams = new URLSearchParams()

    // Add fields to include related data
    searchParams.set('fields', 'id,etag,number,issued_at,due_at,balance,state,total,sub_total,pending,discount,tax_sum,secondary_tax_sum,services_secondary_tax,services_sub_total,expenses_secondary_tax,expenses_sub_total,available_state_transitions,start_at,end_at,matter{id,display_number,description,client{id,name}},client{id,name,primary_email_address},responsible_attorney{id,name,email}')

    if (params?.state) searchParams.set('state', params.state)
    if (params?.client_id) searchParams.set('client_id', params.client_id.toString())
    if (params?.matter_id) searchParams.set('matter_id', params.matter_id.toString())
    if (params?.updated_since) searchParams.set('updated_since', params.updated_since)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/bills.json?${searchParams.toString()}`)
  }

  /**
   * Get bills awaiting approval (for polling)
   */
  async getBillsAwaitingApproval(): Promise<ClioApiResponse<ClioBillResponse[]>> {
    return this.getBills({ state: 'awaiting_approval' })
  }

  /**
   * Get all bills awaiting approval (handles pagination)
   */
  async getAllBillsAwaitingApproval(): Promise<ClioBillResponse[]> {
    const params = new URLSearchParams()
    params.set('state', 'awaiting_approval')
    params.set('fields', 'id,etag,number,issued_at,due_at,balance,state,total,sub_total,pending,discount,start_at,end_at,matter{id,display_number,description,client{id,name}},client{id,name,primary_email_address},responsible_attorney{id,name,email}')

    return this.fetchAllPages<ClioBillResponse>('/bills.json', params)
  }

  /**
   * Get a single bill by ID
   */
  async getBill(id: number): Promise<ClioApiResponse<ClioBillResponse>> {
    return this.request(`/bills/${id}.json?fields=id,etag,number,issued_at,due_at,balance,state,total,sub_total,pending,discount,tax_sum,start_at,end_at,available_state_transitions,matter{id,display_number,description,client{id,name}},client{id,name,primary_email_address},responsible_attorney{id,name,email}`)
  }

  /**
   * Update a bill's state
   */
  async updateBillState(
    id: number,
    state: string,
    etag: string
  ): Promise<ClioApiResponse<ClioBillResponse>> {
    return this.request(`/bills/${id}.json`, {
      method: 'PATCH',
      headers: {
        'If-Match': etag,
      },
      body: JSON.stringify({
        data: { state },
      }),
    })
  }

  /**
   * Delete/Void a bill
   */
  async deleteBill(id: number, etag: string): Promise<void> {
    await this.request(`/bills/${id}.json`, {
      method: 'DELETE',
      headers: {
        'If-Match': etag,
      },
    })
  }

  // ===========================================
  // Line Items (Bill Activities)
  // ===========================================

  /**
   * Get line items for a bill
   */
  async getBillLineItems(billId: number): Promise<ClioApiResponse<ClioLineItemResponse[]>> {
    return this.request(`/bills/${billId}/line_items.json?fields=id,etag,type,kind,date,description,quantity,price,total,note,activity{id,type,date,quantity,rate,price,total,note,non_billable,billed,user{id,name,email},matter{id,display_number},activity_description{id,name,utbms_task{id,code,name},utbms_activity{id,code,name}}},user{id,name,email},expense_category{id,name}`)
  }

  /**
   * Get all line items for a bill (handles pagination)
   */
  async getAllBillLineItems(billId: number): Promise<ClioLineItemResponse[]> {
    const params = new URLSearchParams()
    params.set('fields', 'id,etag,type,kind,date,description,quantity,price,total,note,activity{id,type,date,quantity,rate,price,total,note,non_billable,billed,user{id,name,email},matter{id,display_number},activity_description{id,name,utbms_task{id,code,name},utbms_activity{id,code,name}}},user{id,name,email},expense_category{id,name}')

    return this.fetchAllPages<ClioLineItemResponse>(`/bills/${billId}/line_items.json`, params)
  }

  // ===========================================
  // Activities
  // ===========================================

  /**
   * Get activities with optional filters
   */
  async getActivities(params?: {
    bill_id?: number
    matter_id?: number
    user_id?: number
    type?: string
    updated_since?: string
    limit?: number
    page_token?: string
  }): Promise<ClioApiResponse<ClioActivityResponse[]>> {
    const searchParams = new URLSearchParams()

    searchParams.set('fields', 'id,etag,type,date,quantity,quantity_in_hours,rate,price,total,non_billable,billed,note,flat_rate,user{id,name,email},matter{id,display_number,description},activity_description{id,name,utbms_task{id,code,name},utbms_activity{id,code,name}},bill{id,number}')

    if (params?.bill_id) searchParams.set('bill_id', params.bill_id.toString())
    if (params?.matter_id) searchParams.set('matter_id', params.matter_id.toString())
    if (params?.user_id) searchParams.set('user_id', params.user_id.toString())
    if (params?.type) searchParams.set('type', params.type)
    if (params?.updated_since) searchParams.set('updated_since', params.updated_since)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/activities.json?${searchParams.toString()}`)
  }

  /**
   * Get a single activity by ID
   */
  async getActivity(id: number): Promise<ClioApiResponse<ClioActivityResponse>> {
    return this.request(`/activities/${id}.json?fields=id,etag,type,date,quantity,quantity_in_hours,rate,price,total,non_billable,billed,note,flat_rate,user{id,name,email},matter{id,display_number,description},activity_description{id,name,utbms_task{id,code,name},utbms_activity{id,code,name}},bill{id,number}`)
  }

  /**
   * Update an activity
   */
  async updateActivity(
    id: number,
    data: Partial<{
      date: string
      quantity: number
      rate: number
      note: string
      non_billable: boolean
      activity_description: { id: number }
    }>,
    etag: string
  ): Promise<ClioApiResponse<ClioActivityResponse>> {
    return this.request(`/activities/${id}.json`, {
      method: 'PATCH',
      headers: {
        'If-Match': etag,
      },
      body: JSON.stringify({ data }),
    })
  }

  /**
   * Delete an activity
   */
  async deleteActivity(id: number, etag: string): Promise<void> {
    await this.request(`/activities/${id}.json`, {
      method: 'DELETE',
      headers: {
        'If-Match': etag,
      },
    })
  }

  /**
   * Remove activity from bill (set bill_id to null - "hold")
   */
  async holdActivity(id: number, etag: string): Promise<ClioApiResponse<ClioActivityResponse>> {
    return this.request(`/activities/${id}.json`, {
      method: 'PATCH',
      headers: {
        'If-Match': etag,
      },
      body: JSON.stringify({
        data: { bill: null },
      }),
    })
  }

  // ===========================================
  // Users
  // ===========================================

  /**
   * Get all users
   */
  async getUsers(params?: {
    enabled?: boolean
    limit?: number
    page_token?: string
  }): Promise<ClioApiResponse<ClioUserResponse[]>> {
    const searchParams = new URLSearchParams()

    searchParams.set('fields', 'id,etag,name,first_name,last_name,email,enabled,type,rate')

    if (params?.enabled !== undefined) searchParams.set('enabled', params.enabled.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/users.json?${searchParams.toString()}`)
  }

  /**
   * Get all users (handles pagination)
   */
  async getAllUsers(enabled?: boolean): Promise<ClioUserResponse[]> {
    const params = new URLSearchParams()
    params.set('fields', 'id,etag,name,first_name,last_name,email,enabled,type,rate')
    if (enabled !== undefined) {
      params.set('enabled', enabled.toString())
    }

    return this.fetchAllPages<ClioUserResponse>('/users.json', params)
  }

  /**
   * Get current user (who made the OAuth authorization)
   */
  async getCurrentUser(): Promise<ClioApiResponse<ClioUserResponse>> {
    return this.request('/users/who_am_i.json?fields=id,etag,name,first_name,last_name,email,enabled,type,rate')
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: number): Promise<ClioApiResponse<ClioUserResponse>> {
    return this.request(`/users/${id}.json?fields=id,etag,name,first_name,last_name,email,enabled,type,rate`)
  }

  // ===========================================
  // Contacts (Clients)
  // ===========================================

  /**
   * Get contacts
   */
  async getContacts(params?: {
    type?: string
    query?: string
    limit?: number
    page_token?: string
  }): Promise<ClioApiResponse<ClioContactResponse[]>> {
    const searchParams = new URLSearchParams()

    searchParams.set('fields', 'id,etag,name,first_name,last_name,type,primary_email_address,primary_phone_number')

    if (params?.type) searchParams.set('type', params.type)
    if (params?.query) searchParams.set('query', params.query)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/contacts.json?${searchParams.toString()}`)
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: number): Promise<ClioApiResponse<ClioContactResponse>> {
    return this.request(`/contacts/${id}.json?fields=id,etag,name,first_name,last_name,type,primary_email_address,primary_phone_number,custom_field_values{id,value,custom_field{id,name}}`)
  }

  /**
   * Get all contacts (handles pagination)
   */
  async getAllContacts(type?: string): Promise<ClioContactResponse[]> {
    const params = new URLSearchParams()
    params.set('fields', 'id,etag,name,first_name,last_name,type,primary_email_address')
    if (type) {
      params.set('type', type)
    }

    return this.fetchAllPages<ClioContactResponse>('/contacts.json', params)
  }

  // ===========================================
  // Matters
  // ===========================================

  /**
   * Get matters
   */
  async getMatters(params?: {
    client_id?: number
    responsible_attorney_id?: number
    status?: string
    limit?: number
    page_token?: string
  }): Promise<ClioApiResponse<ClioMatterResponse[]>> {
    const searchParams = new URLSearchParams()

    searchParams.set('fields', 'id,etag,display_number,description,status,client{id,name},responsible_attorney{id,name,email}')

    if (params?.client_id) searchParams.set('client_id', params.client_id.toString())
    if (params?.responsible_attorney_id) searchParams.set('responsible_attorney_id', params.responsible_attorney_id.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/matters.json?${searchParams.toString()}`)
  }

  /**
   * Get a single matter by ID
   */
  async getMatter(id: number): Promise<ClioApiResponse<ClioMatterResponse>> {
    return this.request(`/matters/${id}.json?fields=id,etag,display_number,description,status,client{id,name},responsible_attorney{id,name,email},originating_attorney{id,name}`)
  }

  // ===========================================
  // Activity Descriptions (UTBMS Codes)
  // ===========================================

  /**
   * Get activity descriptions (for UTBMS codes)
   */
  async getActivityDescriptions(params?: {
    limit?: number
    page_token?: string
  }): Promise<ClioApiResponse<any[]>> {
    const searchParams = new URLSearchParams()
    searchParams.set('fields', 'id,name,utbms_task{id,code,name},utbms_activity{id,code,name}')

    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/activity_descriptions.json?${searchParams.toString()}`)
  }

  /**
   * Get all activity descriptions (handles pagination)
   */
  async getAllActivityDescriptions(): Promise<any[]> {
    const params = new URLSearchParams()
    params.set('fields', 'id,name,utbms_task{id,code,name},utbms_activity{id,code,name}')

    return this.fetchAllPages('/activity_descriptions.json', params)
  }
}

// Export factory function for creating clients
export const createClioClient = (
  accessToken: string,
  refreshToken?: string,
  onTokenUpdate?: TokenUpdateCallback
) => {
  return new ClioClient(accessToken, refreshToken, onTokenUpdate)
}

export default ClioClient
