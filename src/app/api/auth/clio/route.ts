import { redirect } from 'next/navigation'
import { ClioClient } from '@/services/clio'

export async function GET() {
  // Redirect to Clio OAuth authorization URL
  const authUrl = ClioClient.getAuthorizationUrl()
  redirect(authUrl)
}
