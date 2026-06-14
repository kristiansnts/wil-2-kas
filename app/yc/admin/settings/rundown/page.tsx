import SettingUrlClient from '@/components/yc/admin/SettingUrlClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { getRundownPdfUrl } from '@/lib/yc/settings'
import { YC_DEFAULT_PDFS } from '@/lib/yc/constants'

export default async function RundownSettingsPage() {
  await requireYcAdmin()
  const currentUrl = await getRundownPdfUrl()
  return (
    <SettingUrlClient
      kind="rundown"
      currentUrl={currentUrl}
      defaultUrl={YC_DEFAULT_PDFS.rundown}
    />
  )
}
