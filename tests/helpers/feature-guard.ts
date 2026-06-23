export function isFeatureDisabled(res: Response, data: { error?: string }): boolean {
  return res.status === 403 && /belum dibuka/i.test(String(data.error ?? ''))
}

export function expectFeatureOpenOrDisabled(
  res: Response,
  data: { error?: string },
  featureName: string,
): 'open' | 'disabled' {
  if (isFeatureDisabled(res, data)) {
    console.warn(`[smoke] ${featureName} feature flag OFF in production — enable before game day`)
    return 'disabled'
  }
  if (res.status >= 500) {
    throw new Error(`${featureName} server error ${res.status}: ${JSON.stringify(data)}`)
  }
  return 'open'
}
