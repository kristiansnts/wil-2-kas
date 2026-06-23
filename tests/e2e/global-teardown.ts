import { execSync } from 'child_process'

export default async function globalTeardown() {
  execSync('npx tsx scripts/smoke-reset.ts', { stdio: 'inherit', env: process.env })
}
