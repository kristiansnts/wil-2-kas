export function fmt(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export function fmtShort(n: number): string {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + ' jt'
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + ' rb'
  return 'Rp ' + n
}

export function fmtDate(d: string): string {
  const datePart = d.includes('T') ? d.split('T')[0] : d
  const [y, m, day] = datePart.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
