import Link from 'next/link'

// Server-component page shell for the no-JS fallback form pages.
// Renders the standard topnav + back link + content wrapper (matches PertemuanClient).
export function FormShell({
  title,
  sub,
  back,
  children,
}: {
  title: string
  sub?: string
  back: string
  children: React.ReactNode
}) {
  return (
    <div className="screen">
      <div className="topnav">
        <Link href={back} className="back-btn">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topnav-title">{title}</div>
          {sub && <div className="topnav-sub">{sub}</div>}
        </div>
      </div>
      <div className="content">{children}</div>
    </div>
  )
}
