import { notFound } from 'next/navigation'
import GroupClient from '@/components/yc/participant/GroupClient'
import { requireParticipantPage } from '@/lib/yc/page-guard'

type Props = { params: Promise<{ token: string }> }

export default async function GroupPage({ params }: Props) {
  const { token } = await params
  const participant = await requireParticipantPage(token)
  if (!participant.group) notFound()

  const g = participant.group
  return (
    <GroupClient
      token={token}
      participantId={participant.id}
      group={{
        id: g.id,
        name: g.name,
        slug: g.slug,
        points: g.points,
        captain: g.captain ? { id: g.captain.id, name: g.captain.name ?? '' } : null,
        contentCreator: g.contentCreator
          ? { id: g.contentCreator.id, name: g.contentCreator.name ?? '' }
          : null,
        members: g.participants.map(m => ({
          id: m.id,
          name: m.name,
          token: m.token,
        })),
      }}
    />
  )
}
