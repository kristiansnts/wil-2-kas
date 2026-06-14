import { NextResponse } from 'next/server'
import { listChurchOptions } from '@/lib/yc/churches'

export async function GET() {
  const churches = await listChurchOptions()
  return NextResponse.json({ churches })
}
