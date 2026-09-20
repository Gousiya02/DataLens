export function formatValue(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M'
    if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + 'K'
    return val.toFixed(2)
  }
  return String(val)
}

export function truncate(str, n = 14) {
  return str?.length > n ? str.slice(0, n) + '…' : str
}
