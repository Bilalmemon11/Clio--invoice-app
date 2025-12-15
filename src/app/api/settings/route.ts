// ===========================================
// Settings API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  isAdmin,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/auth'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import { ensureDefaultSettings } from '@/lib/auto-seed'

// ===========================================
// GET /api/settings - Get all settings
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Ensure default settings exist (auto-seed on first run)
    await ensureDefaultSettings()

    // Get all settings from database
    const settings = await prisma.setting.findMany()

    // Create a map with defaults
    const settingsMap: Record<string, string> = {
      polling_interval_minutes: String(DEFAULT_SETTINGS.POLLING_INTERVAL_MINUTES),
      auto_send_first_round_emails: String(DEFAULT_SETTINGS.AUTO_SEND_FIRST_ROUND_EMAILS),
      default_skip_first_round: String(DEFAULT_SETTINGS.DEFAULT_SKIP_FIRST_ROUND),
      approval_token_expiry_hours: String(DEFAULT_SETTINGS.APPROVAL_TOKEN_EXPIRY_HOURS),
    }

    // Override with database values
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    // Get LEDES clients
    const ledesClients = await prisma.client.findMany({
      where: { isLedesBilling: true },
      select: { id: true, name: true, clioId: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...settingsMap,
        ledesClients,
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return serverErrorResponse('Failed to fetch settings')
  }
}

// ===========================================
// PUT /api/settings - Update settings
// ===========================================

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Only admins can update settings
    if (user.role !== 'ADMIN') {
      return forbiddenResponse('Admin access required')
    }

    const body = await request.json()

    // Handle each setting update
    const validSettings = [
      'polling_interval_minutes',
      'auto_send_first_round_emails',
      'default_skip_first_round',
      'approval_token_expiry_hours',
    ]

    const updatedSettings: string[] = []

    for (const key of validSettings) {
      if (body[key] !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: {
            key,
            value: String(body[key]),
            description: getSettingDescription(key),
          },
        })
        updatedSettings.push(key)
      }
    }

    // Handle LEDES clients update
    if (body.ledesClientIds !== undefined) {
      // First, remove LEDES flag from all clients
      await prisma.client.updateMany({
        where: { isLedesBilling: true },
        data: { isLedesBilling: false },
      })

      // Then set LEDES flag for specified clients
      if (body.ledesClientIds.length > 0) {
        await prisma.client.updateMany({
          where: { id: { in: body.ledesClientIds } },
          data: { isLedesBilling: true },
        })
      }
      updatedSettings.push('ledesClients')
    }

    return NextResponse.json({
      success: true,
      message: `Updated settings: ${updatedSettings.join(', ')}`,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return serverErrorResponse('Failed to update settings')
  }
}

// Helper function to get setting descriptions
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    polling_interval_minutes: 'How often to poll Clio for new bills (in minutes)',
    auto_send_first_round_emails: 'Automatically send emails when bills enter first round review',
    default_skip_first_round: 'Skip first round approval by default for new bills',
    approval_token_expiry_hours: 'How long approval links are valid (in hours)',
  }
  return descriptions[key] || ''
}
