// ===========================================
// Database Seed Script
// ===========================================
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // ===========================================
  // Default Settings
  // ===========================================

  const defaultSettings = [
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

  console.log('Seeding default settings...')

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        description: setting.description,
      },
      create: setting,
    })
    console.log(`  - ${setting.key}: ${setting.value}`)
  }

  console.log('Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
