import EmergencySoundProvider from '@/components/yc/participant/EmergencySoundProvider'
import NametagPairingProvider from '@/components/yc/participant/NametagPairingProvider'
import { getParticipantFeatureFlags } from '@/lib/yc/features'

type Props = { children: React.ReactNode; params: Promise<{ token: string }> }

export default async function ParticipantLayout({ children, params }: Props) {
  const { token } = await params
  const features = await getParticipantFeatureFlags()
  const body = features.nametagPairing ? (
    <NametagPairingProvider token={token}>{children}</NametagPairingProvider>
  ) : (
    children
  )
  return <EmergencySoundProvider token={token}>{body}</EmergencySoundProvider>
}
