'use server'

import { redirect } from 'next/navigation'
import { setSession, clearSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function login(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const username = ((formData.get('username') as string) ?? '').trim()
  const password = ((formData.get('password') as string) ?? '').trim()

  if (username === 'admin' && password === 'admin') {
    await setSession({ role: 'admin' })
    redirect('/')
  }

  if (password === 'komisi') {
    const division = await prisma.division.findFirst({
      where: { name: { equals: username, mode: 'insensitive' } },
    })
    if (division) {
      await setSession({ role: 'division', divisionId: division.id })
      redirect(`/divisi/${division.id}`)
    }
  }

  return { error: 'Username atau password salah' }
}

export async function logout() {
  await clearSession()
  redirect('/login')
}
