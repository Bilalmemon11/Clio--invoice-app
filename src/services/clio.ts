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

// Placeholder - will be replaced with actual credentials in Phase 2
const CLIO_CLIENT_ID = process.env.CLIO_CLIENT_ID || '{{CLIO_CLIENT_ID}}'
const CLIO_CLIENT_SECRET = process.env.CLIO_CLIENT_SECRET || '{{CLIO_CLIENT_SECRET}}'
const CLIO_REDIRECT_URI = process.env.CLIO_REDIRECT_URI || 'http://localhost:3000/api/auth/clio/callback'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/**
 * Clio API Client
 * Handles all interactions with the Clio API
 */
export class ClioClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(accessToken?: string, refreshToken?: string) {
    this.accessToken = accessToken || null
    this.refreshToken = refreshToken || null
  }

  // ===========================================
  // OAuth Methods
  // ===========================================

  /**
   * Generate the OAuth authorization URL
   */
  static getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIO_CLIENT_ID,
      redirect_uri: CLIO_REDIRECT_URI,
      scope: CLIO_SCOPES,
    })
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

    return tokens
  }

  // ===========================================
  // HTTP Methods
  // ===========================================

  /**
   * Make an authenticated request to the Clio API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const url = `${CLIO_API_BASE}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken()
      // Retry the request
      return this.request(endpoint, options)
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Clio API error: ${response.status} - ${error}`)
    }

    return response.json()
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
    searchParams.set('fields', 'id,etag,number,issued_at,due_at,balance,state,total,sub_total,matter{id,display_number,description},client{id,name},responsible_attorney{id,name}')

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
   * Get a single bill by ID
   */
  async getBill(id: number): Promise<ClioApiResponse<ClioBillResponse>> {
    return this.request(`/bills/${id}.json?fields=id,etag,number,issued_at,due_at,balance,state,total,sub_total,matter{id,display_number,description},client{id,name},responsible_attorney{id,name},user{id,name}`)
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

  // ===========================================
  // Line Items (Bill Activities)
  // ===========================================

  /**
   * Get line items for a bill
   */
  async getBillLineItems(billId: number): Promise<ClioApiResponse<ClioLineItemResponse[]>> {
    return this.request(`/bills/${billId}/line_items.json?fields=id,etag,type,kind,date,description,quantity,price,total,activity{id,type},user{id,name}`)
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

    searchParams.set('fields', 'id,etag,type,date,quantity,quantity_in_hours,rate,price,total,non_billable,billed,note,user{id,name},matter{id,display_number,description},activity_description{id,name,utbms_task{id,code,name}}')

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
    return this.request(`/activities/${id}.json?fields=id,etag,type,date,quantity,quantity_in_hours,rate,price,total,non_billable,billed,note,user{id,name},matter{id,display_number,description},activity_description{id,name,utbms_task{id,code,name}}`)
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
      activity_description_id: number
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
   * Delete an activity (soft delete - marks as non-billable)
   */
  async deleteActivity(id: number, etag: string): Promise<void> {
    await this.request(`/activities/${id}.json`, {
      method: 'DELETE',
      headers: {
        'If-Match': etag,
      },
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

    searchParams.set('fields', 'id,etag,name,first_name,last_name,email,enabled,type')

    if (params?.enabled !== undefined) searchParams.set('enabled', params.enabled.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.page_token) searchParams.set('page_token', params.page_token)

    return this.request(`/users.json?${searchParams.toString()}`)
  }

  /**
   * Get current user (who made the OAuth authorization)
   */
  async getCurrentUser(): Promise<ClioApiResponse<ClioUserResponse>> {
    return this.request('/users/who_am_i.json?fields=id,etag,name,first_name,last_name,email,enabled,type')
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: number): Promise<ClioApiResponse<ClioUserResponse>> {
    return this.request(`/users/${id}.json?fields=id,etag,name,first_name,last_name,email,enabled,type`)
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

    searchParams.set('fields', 'id,etag,name,first_name,last_name,type,primary_email_address{address}')

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
    return this.request(`/contacts/${id}.json?fields=id,etag,name,first_name,last_name,type,primary_email_address{address},custom_field_values{id,value,custom_field{id,name}}`)
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

    searchParams.set('fields', 'id,etag,display_number,description,status,client{id,name},responsible_attorney{id,name}')

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
    return this.request(`/matters/${id}.json?fields=id,etag,display_number,description,status,client{id,name},responsible_attorney{id,name},originating_attorney{id,name}`)
  }
}

// Export singleton instance for server-side usage
export const createClioClient = (accessToken: string, refreshToken?: string) => {
  return new ClioClient(accessToken, refreshToken)
}

export default ClioClient
