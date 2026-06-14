import SettingUrlClient from '@/components/yc/admin/SettingUrlClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { getKamarPdfUrl } from '@/lib/yc/settings'
import { YC_DEFAULT_PDFS } from '@/lib/yc/constants'

export default async function KamarSettingsPage() {
  await requireYcAdmin()
  const currentUrl = await getKamarPdfUrl()
  return (
    <SettingUrlClient
      kind="kamar"
      currentUrl={currentUrl}
      defaultUrl={YC_DEFAULT_PDFS.kamar}
    />
  )
}
