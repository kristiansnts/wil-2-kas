import { OUTBOUND_POSITION_COUNT, outboundFullScheduleTable } from '@/lib/yc/outbound-data'

export default function OutboundScheduleTable({ highlightPosition }: { highlightPosition?: number }) {
  const rows = outboundFullScheduleTable()

  return (
    <div className="yc-admin-table-wrap yc-outbound-schedule-wrap">
      <table className="yc-admin-table yc-outbound-schedule-table">
        <thead>
          <tr>
            <th>Ronde</th>
            {Array.from({ length: OUTBOUND_POSITION_COUNT }, (_, i) => i + 1).map(pos => (
              <th
                key={pos}
                className={highlightPosition === pos ? 'yc-outbound-schedule-col--active' : undefined}
              >
                Pos {pos}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.round}>
              <td className="yc-admin-table-muted">{row.round}</td>
              {row.positions.map(cell => (
                <td
                  key={cell.position}
                  className={
                    highlightPosition === cell.position ? 'yc-outbound-schedule-col--active' : undefined
                  }
                >
                  {cell.label}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
