import FeatureFlagsClient from '@/components/yc/admin/FeatureFlagsClient'
import { getParticipantFeatureFlags } from '@/lib/yc/features'
import { requireYcAdmin } from '@/lib/yc/session'

export default async function FeatureSettingsPage() {
  await requireYcAdmin()
  const flags = await getParticipantFeatureFlags()
  return <FeatureFlagsClient initial={flags} />
}
