import { requireAuth } from '@/lib/dal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return children
}
