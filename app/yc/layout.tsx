import type { Metadata } from 'next'
import { YC_BRAND } from '@/lib/yc/constants'

export const metadata: Metadata = {
  title: YC_BRAND,
  description: 'Youth Camp companion app',
}

export default function YcLayout({ children }: { children: React.ReactNode }) {
  return children
}
