// ===========================================
// Authentication Utilities
// ===========================================

import { cookies } from 'next/headers'
import { prisma } from './db'
import type { User } from '@prisma/client'

// ===========================================
// Session Management
// ===========================================

/**
 * Get the current session user from cookies
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    })

    if (!user || !user.isActive) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get user with validation that they have a valid Clio token
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const user = await getCurrentUser()

  if (!user?.accessToken) {
    return null
  }

  return user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Check if user is a responsible attorney
 */
export async function isResponsibleAttorney(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'RESPONSIBLE_ATTORNEY' || user?.role === 'ADMIN'
}

/**
 * Set session cookie
 */
export function setSessionCookie(userId: string): void {
  const cookieStore = cookies()
  cookieStore.set('session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): void {
  const cookieStore = cookies()
  cookieStore.delete('session')
}

// ===========================================
// API Route Helpers
// ===========================================

import { NextResponse } from 'next/server'

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

/**
 * Create a not found response
 */
export function notFoundResponse(message: string = 'Not found'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  )
}

/**
 * Create a bad request response
 */
export function badRequestResponse(message: string = 'Bad request'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}

/**
 * Create an internal server error response
 */
export function serverErrorResponse(message: string = 'Internal server error'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  )
}

// ===========================================
// Wrapper for protected API routes
// ===========================================

type ApiHandler = (
  request: Request,
  user: User,
  ...args: any[]
) => Promise<NextResponse>

/**
 * Wrap an API handler to require authentication
 */
export function withAuth(handler: ApiHandler): (request: Request, ...args: any[]) => Promise<NextResponse> {
  return async (request: Request, ...args: any[]) => {
    const user = await getAuthenticatedUser()

    if (!user) {
      return unauthorizedResponse('Please log in to continue')
    }

    return handler(request, user, ...args)
  }
}

/**
 * Wrap an API handler to require admin role
 */
export function withAdmin(handler: ApiHandler): (request: Request, ...args: any[]) => Promise<NextResponse> {
  return async (request: Request, ...args: any[]) => {
    const user = await getAuthenticatedUser()

    if (!user) {
      return unauthorizedResponse('Please log in to continue')
    }

    if (user.role !== 'ADMIN') {
      return forbiddenResponse('Admin access required')
    }

    return handler(request, user, ...args)
  }
}

export default {
  getCurrentUser,
  getAuthenticatedUser,
  isAuthenticated,
  isAdmin,
  isResponsibleAttorney,
  setSessionCookie,
  clearSessionCookie,
  withAuth,
  withAdmin,
}
