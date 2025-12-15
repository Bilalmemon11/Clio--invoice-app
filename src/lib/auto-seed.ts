// ===========================================
// Auto-Seed Utility
// ===========================================
// Automatically seeds default settings if they don't exist
// Called on app initialization to ensure database is ready

import { prisma } from './db'

const DEFAULT_SETTINGS = [
  {
    key: 'polling_interval_minutes',
    value: '15',
    description: 'How often to poll Clio for new bills (in minutes)',
  },
  {
    key: 'auto_send_first_round_emails',
    value: 'false',
    description: 'Automatically send emails when bills enter first round review',
  },
  {
    key: 'default_skip_first_round',
    value: 'false',
    description: 'Skip first round approval by default for new bills',
  },
  {
    key: 'approval_token_expiry_hours',
    value: '72',
    description: 'How long approval links are valid (in hours)',
  },
]

// Track if seeding has been checked this session
let seedingChecked = false

/**
 * Ensures default settings exist in the database.
 * Safe to call multiple times - only seeds once per session and uses upsert.
 */
export async function ensureDefaultSettings(): Promise<void> {
  // Only check once per server instance
  if (seedingChecked) {
    return
  }

  try {
    // Check if any settings exist
    const existingCount = await prisma.setting.count()

    if (existingCount === 0) {
      console.log('[Auto-Seed] No settings found, seeding defaults...')

      for (const setting of DEFAULT_SETTINGS) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            description: setting.description,
          },
          create: setting,
        })
      }

      console.log('[Auto-Seed] Default settings created successfully')
    }

    seedingChecked = true
  } catch (error) {
    // Log but don't throw - allow app to continue
    console.error('[Auto-Seed] Error checking/seeding settings:', error)
  }
}
