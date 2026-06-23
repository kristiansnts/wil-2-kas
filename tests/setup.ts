import { config as loadDotenv } from 'dotenv'
import path from 'path'

const root = process.cwd()
loadDotenv({ path: path.join(root, '.env.test') })
loadDotenv({ path: path.join(root, '.env') })
loadDotenv({ path: path.join(root, '.env.local') })
