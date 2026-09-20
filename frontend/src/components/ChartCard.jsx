import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Trash2, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { truncate, formatValue } from '../utils/format'

const COLORS = ['#FF6B00', '#FFB800', '#22A06B', '#E5484D', '#36B37E', '#FF8B00']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#FFB800]/60 rounded-xl px-3 py-2 text-xs shadow-lg text-[#172033]">
      {label && <p className="text-[#536482] mb-1 truncate max-w-[160px] font-bold">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#FF6B00' }} className="font-extrabold">
          {formatValue(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ChartCard({
  chart,
  index,
  totalCharts,
  onDelete,
  isSelected,
  onToggleSelect,
  isSelectMode,
  onMoveChart,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  isDragOver
}) {
  const { type, title, data, reason } = chart

  const renderChart = () => {
    if (!data?.length) return <p className="text-[#536482] text-sm text-center py-8">No data</p>

    const h = 200

    if (type === 'line') return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFB800" strokeOpacity={0.4} />
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#172033' }} tickFormatter={v => truncate(String(v), 8)} />
          <YAxis tick={{ fontSize: 10, fill: '#172033' }} tickFormatter={formatValue} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="y" stroke="#FF6B00" strokeWidth={2.5} dot={{ fill: '#FFB800', r: 3 }} activeDot={{ r: 5, fill: '#FF6B00' }} />
        </LineChart>
      </ResponsiveContainer>
    )

    if (type === 'bar' || type === 'hbar') return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart
          data={data}
          layout={type === 'hbar' ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 8, left: type === 'hbar' ? 60 : -20, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#FFB800" strokeOpacity={0.4} />
          {type === 'hbar' ? (
            <>
              <YAxis dataKey="x" type="category" tick={{ fontSize: 9, fill: '#172033' }} tickFormatter={v => truncate(String(v), 12)} width={60} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#172033' }} tickFormatter={formatValue} />
            </>
          ) : (
            <>
              <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#172033' }} tickFormatter={v => truncate(String(v), 8)} />
              <YAxis tick={{ fontSize: 10, fill: '#172033' }} tickFormatter={formatValue} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="y" fill="#FF6B00" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )

    if (type === 'pie') return (
      <ResponsiveContainer width="100%" height={h}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => formatValue(v)} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#172033' }} />
        </PieChart>
      </ResponsiveContainer>
    )

    if (type === 'scatter') return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFB800" strokeOpacity={0.4} />
          <XAxis dataKey="x" type="number" tick={{ fontSize: 10, fill: '#172033' }} tickFormatter={formatValue} name={chart.x} />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#172033' }} tickFormatter={formatValue} name={chart.y} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter data={data} fill="#FF6B00" opacity={0.85} />
        </ScatterChart>
      </ResponsiveContainer>
    )

    return null
  }

  return (
    <div
      draggable={!isSelectMode}
      onDragStart={(e) => !isSelectMode && onDragStart && onDragStart(e, index)}
      onDragOver={(e) => !isSelectMode && onDragOver && onDragOver(e, index)}
      onDragEnd={(e) => !isSelectMode && onDragEnd && onDragEnd(e)}
      onDrop={(e) => !isSelectMode && onDrop && onDrop(e, index)}
      onClick={isSelectMode && onToggleSelect ? () => onToggleSelect(chart) : undefined}
      className={`card flex flex-col gap-3 border transition-all duration-200 bg-white relative group ${
        isSelected
          ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/30 shadow-md bg-[#FFFDF5]'
          : 'border-[#FFB800]/40 hover:border-[#FF6B00] shadow-sm hover:shadow-md'
      } ${isSelectMode ? 'cursor-pointer' : ''} ${
        isDragging ? 'chart-card-dragging' : ''
      } ${isDragOver ? 'chart-card-drag-over' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#FFB800]/20 pb-2.5">
        <div className="flex items-center gap-2 truncate flex-1">
          {!isSelectMode && (
            <div
              className="drag-handle shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#FFB800]/20 text-[#536482] hover:text-[#FF6B00] transition-colors"
              title="Drag handle to rearrange chart position"
            >
              <GripVertical size={16} />
            </div>
          )}

          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={() => onToggleSelect(chart)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer accent-[#FF6B00] shrink-0"
            />
          )}

          <h3 className="text-sm font-extrabold text-[#172033] truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isSelectMode && totalCharts > 1 && onMoveChart && (
            <div className="flex items-center gap-0.5 border border-[#FFB800]/40 rounded-lg p-0.5 bg-[#FFFDF5]">
              <button
                type="button"
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveChart(index, index - 1)
                }}
                className="p-1 hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] text-[#536482] disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
                title="Move chart earlier"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={index === totalCharts - 1}
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveChart(index, index + 1)
                }}
                className="p-1 hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] text-[#536482] disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
                title="Move chart later"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <span className="tag capitalize">{type}</span>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(chart)
              }}
              className="p-1.5 text-[#536482] hover:text-[#E5484D] hover:bg-red-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
              title="Delete this chart"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {renderChart()}
    </div>
  )
}

