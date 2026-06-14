import { FormShell } from '@/components/forms/FormShell'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { getKamarPdfUrl } from '@/lib/yc/settings'

type Props = { params: Promise<{ token: string }> }

export default async function RoomPage({ params }: Props) {
  const { token } = await params
  await requireParticipantPage(token)
  const pdfUrl = await getKamarPdfUrl()

  return (
    <FormShell title="Pembagian Kamar" back={`/yc/p/${token}`}>
      <iframe
        src={pdfUrl}
        title="Kamar PDF"
        style={{ width: '100%', height: '70vh', border: '1px solid var(--border)', borderRadius: 12 }}
      />
    </FormShell>
  )
}
