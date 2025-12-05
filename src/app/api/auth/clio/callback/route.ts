import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ClioClient } from '@/services/clio'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    // Exchange code for tokens
    const tokens = await ClioClient.exchangeCodeForToken(code)

    // Create Clio client with the new tokens
    const clioClient = new ClioClient(tokens.access_token, tokens.refresh_token)

    // Get current user info from Clio
    const userResponse = await clioClient.getCurrentUser()
    const clioUser = userResponse.data

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { clioId: clioUser.id.toString() },
    })

    if (!user) {
      // Create new user with default role
      user = await prisma.user.create({
        data: {
          clioId: clioUser.id.toString(),
          email: clioUser.email,
          name: clioUser.name,
          role: 'TIMEKEEPER', // Default role, can be changed by admin
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
    } else {
      // Update existing user's tokens
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
    }

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
