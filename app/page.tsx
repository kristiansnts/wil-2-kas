import { getKasUmumData } from '@/lib/actions/kas'
import KasUmumClient from '@/components/kas/KasUmumClient'

export default async function Page() {
  const { kasUmum, divisions, transactions } = await getKasUmumData()

  return (
    <KasUmumClient
      balance={kasUmum.balance}
      divisions={divisions.map(d => ({ id: d.id, name: d.name, balance: d.balance }))}
      transactions={transactions.map(t => ({
        id: t.id,
        date: t.date.toISOString(),
        desc: t.desc,
        amount: t.amount,
        type: t.type as 'masuk' | 'keluar',
        refDivId: t.refDivId,
      }))}
    />
  )
}
