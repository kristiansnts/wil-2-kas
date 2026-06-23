import { expect } from 'vitest'
import { getSmokeEnv } from './constants'

export function apiUrl(token: string, path: string): string {
  const base = getSmokeEnv().baseUrl.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}/yc/api/p/${token}${p}`
}

export async function api(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(apiUrl(token, path), init)
}

export async function apiJson<T = unknown>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; data: T }> {
  const res = await api(token, path, init)
  const text = await res.text()
  let data: T
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T)
  } catch {
    data = { raw: text } as T
  }
  return { res, data }
}

export function expectOk(res: Response, label?: string): void {
  expect(res.status, label ?? `HTTP ${res.status}`).toBeLessThan(500)
}

export function expectKeys(obj: Record<string, unknown>, keys: string[]): void {
  for (const key of keys) {
    expect(obj, `missing key ${key}`).toHaveProperty(key)
  }
}

export function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}

export async function readFixtureBytes(relativeFromRoot: string): Promise<Buffer> {
  const { readFileSync } = await import('fs')
  const path = await import('path')
  return readFileSync(path.resolve(process.cwd(), relativeFromRoot))
}

export function adminUrl(path: string): string {
  const base = getSmokeEnv().baseUrl.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
