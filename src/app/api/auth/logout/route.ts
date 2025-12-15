// ===========================================
// Logout API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // Clear the session cookie
  const cookieStore = cookies()
  cookieStore.delete('session')

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request: NextRequest) {
  // Clear the session cookie
  const cookieStore = cookies()
  cookieStore.delete('session')

  // Return JSON response for API calls
  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
