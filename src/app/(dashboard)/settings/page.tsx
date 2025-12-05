'use client'

import { useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { POLLING_INTERVALS, DEFAULT_SETTINGS } from '@/lib/constants'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    pollingIntervalMinutes: DEFAULT_SETTINGS.POLLING_INTERVAL_MINUTES,
    autoSendFirstRoundEmails: DEFAULT_SETTINGS.AUTO_SEND_FIRST_ROUND_EMAILS,
    defaultSkipFirstRound: DEFAULT_SETTINGS.DEFAULT_SKIP_FIRST_ROUND,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Will call API in Phase 2
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)
    console.log('Settings saved:', settings)
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Settings"
        subtitle="Configure application preferences"
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Clio Sync Settings</CardTitle>
            <CardDescription>
              Configure how the application syncs with Clio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="polling-interval">Polling Interval</Label>
              <Select
                value={settings.pollingIntervalMinutes.toString()}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    pollingIntervalMinutes: parseInt(value),
                  }))
                }
              >
                <SelectTrigger id="polling-interval" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLLING_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value.toString()}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                How often to check Clio for new bills in awaiting_approval status
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Settings</CardTitle>
            <CardDescription>
              Configure the approval workflow behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="auto-send-emails"
                checked={settings.autoSendFirstRoundEmails}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoSendFirstRoundEmails: checked as boolean,
                  }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="auto-send-emails">
                  Automatically send first round emails
                </Label>
                <p className="text-sm text-gray-500">
                  When enabled, notification emails will be automatically sent to
                  timekeepers when a bill enters first round review
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="skip-first-round"
                checked={settings.defaultSkipFirstRound}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultSkipFirstRound: checked as boolean,
                  }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="skip-first-round">
                  Skip first round by default
                </Label>
                <p className="text-sm text-gray-500">
                  When enabled, new bills will skip the timekeeper approval round
                  and go directly to the responsible attorney
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>
              Configure email notification settings (requires SendGrid API key)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Email settings will be configured in Phase 2 when SendGrid integration is complete.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LEDES Billing Clients</CardTitle>
            <CardDescription>
              Clients that require LEDES billing format (Send to Client disabled)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              LEDES client list will be configured in Phase 2 when client provides the list.
            </p>
            <div className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Placeholder</p>
              <p>{'{{LEDES_CLIENTS}}'} - Will be replaced with actual client IDs</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
