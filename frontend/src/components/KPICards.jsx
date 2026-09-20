import { TrendingUp, Hash, Layers } from 'lucide-react'
import { formatValue } from '../utils/format'

export default function KPICards({ profile }) {
  if (!profile) return null
  const { kpis = [], row_count, col_count } = profile

  const cards = [
    { label: 'Total rows', value: row_count?.toLocaleString(), icon: Hash, color: 'text-[#FF6B00]' },
    { label: 'Columns', value: col_count, icon: Layers, color: 'text-[#FFB800]' },
    ...kpis.slice(0, 4).map((k, idx) => {
      const palette = ['text-[#FF6B00]', 'text-[#FFB800]', 'text-[#22A06B]', 'text-[#FF6B00]']
      return {
        label: k.label,
        value: formatValue(k.value),
        sub: `Avg ${formatValue(k.avg)}`,
        icon: TrendingUp,
        color: palette[idx % palette.length]
      }
    })
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="card-sm flex flex-col gap-1.5 border border-[#FFB800]/40 hover:border-[#FF6B00] shadow-sm transition-all bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#536482] truncate font-bold">{c.label}</span>
            <c.icon size={14} className={c.color} />
          </div>
          <span className="text-xl font-extrabold text-[#172033]">{c.value}</span>
          {c.sub && <span className="text-xs text-[#536482] font-medium">{c.sub}</span>}
        </div>
      ))}
    </div>
  )
}
