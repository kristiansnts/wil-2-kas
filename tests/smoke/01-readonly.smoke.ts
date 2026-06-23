import { describe, expect, it } from 'vitest'
import { api, apiJson, expectKeys, expectOk } from '../helpers/smoke-api'
import { smokeEnv } from '../helpers/constants'

const tokens = [smokeEnv.token1, smokeEnv.token2, smokeEnv.token3, smokeEnv.token4]

const readPaths = [
  { path: '/emergency/active', keys: ['active'] },
  { path: '/extrovert/active', keys: ['active'] },
  { path: '/documentation/jobs', keys: ['jobs'] },
  { path: '/challenges', keys: ['challenges'] },
  { path: '/challenges/si-paling-extrovert/nametag/status', keys: [] },
  { path: '/challenges/treasure-hunt/emergency/status', keys: [] },
  { path: '/group', keys: ['name', 'members'] },
] as const

describe('YC API readonly smoke', () => {
  for (const token of tokens) {
    describe(`token ${token}`, () => {
      for (const { path, keys } of readPaths) {
        it(`GET ${path}`, async () => {
          const { res, data } = await apiJson<Record<string, unknown>>(token, path)
          expectOk(res, `${token} ${path}`)
          if (keys.length > 0) expectKeys(data, [...keys])
        })
      }
    })
  }
})
