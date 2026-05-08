import { getLogs, getLogFilters } from '@/lib/actions/log'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import LogClient from '@/components/log/LogClient'

export default async function Page() {
  const session = await getSession()
  if (!session) redirect('/login')

  const isAdmin = session.role === 'admin'
  const divisionId = isAdmin ? undefined : session.divisionId

  const [logs, filters] = await Promise.all([
    getLogs(divisionId),
    isAdmin ? getLogFilters() : null,
  ])

  const backHref = isAdmin ? '/' : `/divisi/${session.divisionId}`

  return (
    <LogClient
      backHref={backHref}
      isAdmin={isAdmin}
      divisions={filters?.divisions ?? []}
      logs={logs.map(l => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        desc: l.desc,
        actorRole: l.actorRole,
        divisionId: l.divisionId,
        divisionName: l.divisionName,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  )
}
