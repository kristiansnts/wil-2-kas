export type TxnType = 'masuk' | 'keluar'
export type TxnKategori = 'harian' | 'event'

export interface DivisionItem {
  id: string
  name: string
  balance: number
}

export interface TxnUmumItem {
  id: string
  date: string
  desc: string
  amount: number
  type: TxnType
  refDivId: string | null
}

export interface TxnDivisiItem {
  id: string
  date: string
  desc: string
  amount: number
  type: TxnType
  kategori: TxnKategori | null
  eventId: string | null
}

export interface EventItem {
  id: string
  name: string
  date: string
}

export interface DivisionWithTxns extends DivisionItem {
  transactions: TxnDivisiItem[]
}

export interface DivisionData extends DivisionItem {
  transactions: TxnDivisiItem[]
  events: EventItem[]
}

export type PastorTitle = 'pdp' | 'pdm' | 'pdt'
export type PastorStatus = 'active' | 'inactive' | 'on_hold'

export interface PastorItem {
  id: string
  name: string
  title: PastorTitle
  status: PastorStatus
  pelayanan: string | null
  createdAt: string
}

export type MeetingStatus = 'open' | 'closed'
export type SubmissionStatus = 'pending' | 'approved'

export interface MeetingItem {
  id: string
  token: string
  month: string
  deadline: string
  status: MeetingStatus
  createdAt: string
  _count: { submissions: number }
}

export interface WadahEntryItem {
  divisionId: string
  divisionName: string
  amount: number
}

export interface SubmissionItem {
  id: string
  pastorId: string
  pastorName: string
  pastorTitle: PastorTitle
  pastorPelayanan: string | null
  persepuluhan: number
  bulan: number
  status: SubmissionStatus
  submittedAt: string
  wadahEntries: WadahEntryItem[]
}

export interface SetorBantuanItem {
  id: string
  desc: string
  amount: number
}

export interface MeetingDetailData {
  id: string
  token: string
  month: string
  deadline: string
  status: MeetingStatus
  submissions: SubmissionItem[]
  allPastorCount: number
  setorDate: string | null
  setorNetAmount: number | null
  setorItems: SetorBantuanItem[]
}

export interface LogItem {
  id: string
  action: string
  entity: string
  desc: string
  actorRole: string
  divisionId: string | null
  divisionName: string | null
  createdAt: string
}
