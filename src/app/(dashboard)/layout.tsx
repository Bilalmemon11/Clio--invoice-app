import { Sidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In Phase 2, this will fetch the actual user from the session
  const mockUser = {
    name: 'John Doe',
    email: 'john@gettelaw.com',
    role: 'ADMIN',
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={mockUser} />
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
