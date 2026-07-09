type YcLogPayload = Record<string, unknown>

function serialize(scope: string, event: string, data?: YcLogPayload) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    scope,
    event,
    ...data,
  })
}

/** Server + client console. Filter Vercel logs with `[yc]`. */
export function ycLog(scope: string, event: string, data?: YcLogPayload) {
  console.log(`[yc] ${serialize(scope, event, data)}`)
}

export function ycLogError(scope: string, event: string, data?: YcLogPayload) {
  console.error(`[yc] ${serialize(scope, event, data)}`)
}

/** Client-only: mirror to server via keepalive fetch (survives page unload). */
export function ycLogClient(
  token: string,
  scope: string,
  event: string,
  data?: YcLogPayload,
) {
  ycLog(scope, event, data)
  if (typeof window === 'undefined') return
  void fetch(`/yc/api/p/${token}/debug-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, event, data }),
    keepalive: true,
  }).catch(() => {})
}
