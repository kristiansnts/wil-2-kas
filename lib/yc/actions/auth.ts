'use server'

import { redirect } from 'next/navigation'
import { setYcSession, clearYcSession, verifyYcAdminPassword } from '@/lib/yc/session'

export async function ycLogin(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const password = String(formData.get('password') ?? '')
  if (!verifyYcAdminPassword(password)) {
    return { error: 'Password salah' }
  }
  await setYcSession({ role: 'admin' })
  redirect('/yc/admin')
}

export async function ycLogout(): Promise<void> {
  await clearYcSession()
  redirect('/yc/admin/login')
}
