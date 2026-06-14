export const YC_BRAND = 'YC GPdI Wilayah 2 Madiun'

export const YC_GROUP_COUNT = 10

/** Slug = nama file di public/group-icon/{slug}.jpg */
export const YC_GROUP_SEED = Array.from({ length: YC_GROUP_COUNT }, (_, i) => ({
  slug: `team-${i + 1}`,
  name: `Kelompok ${i + 1}`,
}))

export const SERVICE_OPTIONS = [
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'WL', label: 'Worship Leader' },
  { value: 'GITAR', label: 'Gitar' },
  { value: 'SINGER', label: 'Singer' },
  { value: 'BASS', label: 'Bass' },
  { value: 'MULTIMEDIA', label: 'Multimedia' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const

export type ServiceInterest = (typeof SERVICE_OPTIONS)[number]['value']

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Laki-laki' },
  { value: 'FEMALE', label: 'Perempuan' },
] as const

export type YcGender = (typeof GENDER_OPTIONS)[number]['value']

export const YC_SETTING_KEYS = {
  rundownPdfUrl: 'rundown_pdf_url',
  kamarPdfUrl: 'kamar_pdf_url',
} as const

/** Google Drive rundown — embed pakai /preview */
export const YC_RUNDOWN_DRIVE_URL =
  'https://drive.google.com/file/d/1Z9zLxl5r2_CFObJGQ2K_BOqhdL2M4knB/view?usp=sharing'

export const YC_DEFAULT_PDFS = {
  rundown: 'https://drive.google.com/file/d/1Z9zLxl5r2_CFObJGQ2K_BOqhdL2M4knB/preview',
  kamar: '/yc/docs/kamar.pdf',
} as const

export const YC_DOCUMENTATION_DRIVE_URL =
  'https://drive.google.com/drive/folders/1kVI3jf3-fSOGDFCAUdgE2wyihEvQfIIf'

export const YC_MAX_UPLOAD_BYTES = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
} as const

/** Challenge slug — dokumentasi upload auto-creates YcChallengeSubmission */
export const YC_TUKANG_NGONTEN_SLUG = 'tukang-ngonten'

export const YC_SIPALING_EXTROVERT_SLUG = 'si-paling-extrovert'

export const YC_NAMETAG_MIN_CHARS = 50

export const YC_TEAM_CHALLENGE_SLUG = 'treasure-hunt'

export const YC_QUIZ_ANSWER_SECONDS = 10
export const YC_QUIZ_RETRY_SECONDS = 30

export const YC_EMERGENCY_SOUND_PATH = '/sound/escalation.wav'
export const YC_EMERGENCY_SOUND_STORAGE_KEY = 'yc-emergency-sound'
