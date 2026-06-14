import { jsonError } from '@/lib/yc/api-helpers'
import { YC_SETTING_KEYS, YC_TEAM_CHALLENGE_SLUG } from '@/lib/yc/constants'
import { getYcSetting } from '@/lib/yc/settings'
import type { YcParticipantFeatureFlags } from '@/lib/yc/types'

async function isEnabled(key: string): Promise<boolean> {
  const val = await getYcSetting(key)
  return val === '1'
}

export async function getParticipantFeatureFlags(): Promise<YcParticipantFeatureFlags> {
  const [emergencyAlarm, teamChallenge, worshipForm] = await Promise.all([
    isEnabled(YC_SETTING_KEYS.featureEmergencyAlarm),
    isEnabled(YC_SETTING_KEYS.featureTeamChallenge),
    isEnabled(YC_SETTING_KEYS.featureWorshipForm),
  ])
  return { emergencyAlarm, teamChallenge, worshipForm }
}

export function isTeamChallengeSlug(slug: string): boolean {
  return slug === YC_TEAM_CHALLENGE_SLUG
}

export async function guardTeamChallengeAccess(slug: string) {
  if (!isTeamChallengeSlug(slug)) return null
  if (!(await isEnabled(YC_SETTING_KEYS.featureTeamChallenge))) {
    return jsonError('Team challenge belum dibuka', 403)
  }
  return null
}

export async function guardWorshipFormAccess() {
  if (!(await isEnabled(YC_SETTING_KEYS.featureWorshipForm))) {
    return jsonError('Form Worship Night belum dibuka', 403)
  }
  return null
}
