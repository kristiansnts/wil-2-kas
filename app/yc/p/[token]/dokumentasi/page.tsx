import DocumentationClient from '@/components/yc/participant/DocumentationClient'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { isGroupContentCreator } from '@/lib/yc/participant'
import { listParticipantGalleryJobs } from '@/lib/yc/documentation'

type Props = { params: Promise<{ token: string }> }

export default async function DokumentasiPage({ params }: Props) {
  const { token } = await params
  const participant = await requireParticipantPage(token)
  const initialJobs = await listParticipantGalleryJobs(participant.id)
  return (
    <DocumentationClient
      token={token}
      canUploadAsGroup={isGroupContentCreator(participant)}
      initialJobs={initialJobs}
    />
  )
}
