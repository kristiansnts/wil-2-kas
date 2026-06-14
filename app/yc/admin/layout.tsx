import { getYcSession } from '@/lib/yc/session'

export default async function YcAdminLayout({ children }: { children: React.ReactNode }) {
  // Login page is public; other admin pages check in each page
  await getYcSession()
  return children
}
