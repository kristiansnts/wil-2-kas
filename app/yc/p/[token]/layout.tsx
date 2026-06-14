import EmergencySoundProvider from '@/components/yc/participant/EmergencySoundProvider'
import NametagPairingProvider from '@/components/yc/participant/NametagPairingProvider'

type Props = { children: React.ReactNode; params: Promise<{ token: string }> }

export default async function ParticipantLayout({ children, params }: Props) {
  const { token } = await params
  return (
    <EmergencySoundProvider token={token}>
      <NametagPairingProvider token={token}>{children}</NametagPairingProvider>
    </EmergencySoundProvider>
  )
}
