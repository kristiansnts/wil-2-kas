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
