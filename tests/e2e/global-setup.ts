import { execSync } from 'child_process'
import { config as loadDotenv } from 'dotenv'
import path from 'path'

export default async function globalSetup() {
  loadDotenv({ path: path.resolve(process.cwd(), '.env.test') })
  loadDotenv({ path: path.resolve(process.cwd(), '.env') })
  execSync('npx tsx scripts/smoke-reset.ts', { stdio: 'inherit', env: process.env })
}
