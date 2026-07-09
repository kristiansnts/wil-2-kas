import { jsonError } from '@/lib/yc/api-helpers'
import { YC_SETTING_KEYS, isTeamChallengeSlug } from '@/lib/yc/constants'
import { getYcSetting } from '@/lib/yc/settings'
import type { YcParticipantFeatureFlags } from '@/lib/yc/types'

export { isTeamChallengeSlug }

async function isEnabled(key: string): Promise<boolean> {
  const val = await getYcSetting(key)
  return val === '1'
}

export async function isNametagPairingEnabled(): Promise<boolean> {
  return isEnabled(YC_SETTING_KEYS.featureNametagPairing)
}

export async function getParticipantFeatureFlags(): Promise<YcParticipantFeatureFlags> {
  const [emergencyAlarm, teamChallenge, nametagPairing, worshipForm] = await Promise.all([
    isEnabled(YC_SETTING_KEYS.featureEmergencyAlarm),
    isEnabled(YC_SETTING_KEYS.featureTeamChallenge),
    isEnabled(YC_SETTING_KEYS.featureNametagPairing),
    isEnabled(YC_SETTING_KEYS.featureWorshipForm),
  ])
  return { emergencyAlarm, teamChallenge, nametagPairing, worshipForm }
}

export async function guardTeamChallengeAccess(slug: string) {
  if (!isTeamChallengeSlug(slug)) {
    return jsonError('Scan fragment hanya untuk Perburuan Harta Karun', 404)
  }
  if (!(await isEnabled(YC_SETTING_KEYS.featureTeamChallenge))) {
    return jsonError('Team challenge belum dibuka', 403)
  }
  return null
}

export async function guardNametagPairingAccess() {
  if (!(await isNametagPairingEnabled())) {
    return jsonError('Nametag pairing belum dibuka', 403)
  }
  return null
}

export async function guardWorshipFormAccess() {
  if (!(await isEnabled(YC_SETTING_KEYS.featureWorshipForm))) {
    return jsonError('Form Worship Night belum dibuka', 403)
  }
  return null
}
