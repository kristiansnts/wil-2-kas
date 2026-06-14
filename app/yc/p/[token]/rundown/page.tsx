import { FormShell } from '@/components/forms/FormShell'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { getRundownPdfUrl } from '@/lib/yc/settings'

type Props = { params: Promise<{ token: string }> }

export default async function RundownPage({ params }: Props) {
  const { token } = await params
  await requireParticipantPage(token)
  const pdfUrl = await getRundownPdfUrl()

  const isDrive = pdfUrl.includes('drive.google.com')

  return (
    <FormShell title="Rundown" back={`/yc/p/${token}`}>
      {isDrive && (
        <p className="yc-sound-hint" style={{ marginBottom: 10 }}>
          Jika PDF kosong,{' '}
          <a href={pdfUrl.replace('/preview', '/view')} target="_blank" rel="noopener noreferrer">
            buka di tab baru
          </a>
          .
        </p>
      )}
      <iframe
        src={pdfUrl}
        title="Rundown PDF"
        style={{ width: '100%', height: '70vh', border: '1px solid var(--border)', borderRadius: 12 }}
      />
    </FormShell>
  )
}
