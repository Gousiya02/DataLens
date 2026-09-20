import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Bot, Loader, X, PlusCircle, Check, BarChart2 } from 'lucide-react'
import { queryData } from '../utils/api'
import ChartCard from './ChartCard'

const SUGGESTIONS = [
  '📊 Create a bar chart of top categories',
  '📈 Plot line chart of trends over time',
  '🥧 Show pie chart distribution',
  'Which category has the highest total?',
]

export default function ChatPanel({ onClose, onAddChart }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinnedChartIds, setPinnedChartIds] = useState(new Set())
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const ask = async (question) => {
    const cleanedQ = question.replace(/^[📊📈🥧📋]\s*/, '').trim()
    if (!cleanedQ || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await queryData(cleanedQ)
      setMessages(prev => [...prev, { role: 'ai', data: res.data }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'ai',
        error: e.response?.data?.detail || 'Could not run that query. Try rephrasing.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handlePinChart = (msgIdx, data) => {
    if (!onAddChart || !data?.chart_data?.length) return
    let rawTitle = data.chart_title || data.explanation || 'AI Chart Visualization'
    let title = rawTitle
      .replace(/unnamed:\s*\d+\s*(by)?/gi, '')
      .replace(/^by\s+/i, '')
      .replace(/[-_]/g, ' ')
      .trim()
    if (!title || title.toLowerCase() === 'by') {
      title = 'AI Chart Visualization'
    }

    const newChart = {
      id: `ai-chart-${Date.now()}`,
      type: data.chart_type || 'bar',
      title: title,
      data: data.chart_data,
      reason: data.explanation || `Generated from prompt`
    }
    onAddChart(newChart)
    setPinnedChartIds(prev => new Set(prev).add(msgIdx))
  }

  const renderResult = (data, msgIdx) => {
    if (!data) return null
    const hasChart = data.chart_data && data.chart_data.length > 0 && data.chart_type && data.chart_type !== 'table'
    const isPinned = pinnedChartIds.has(msgIdx)

    return (
      <div className="mt-1 space-y-3">
        {data.explanation && (
          <p className="text-xs text-[#172033] leading-relaxed font-semibold">{data.explanation}</p>
        )}

        {/* AI Generated Chart */}
        {hasChart && (
          <div className="space-y-2">
            <div className="bg-white border border-[#FFB800]/60 rounded-xl p-2.5 shadow-sm">
              <ChartCard
                chart={{
                  type: data.chart_type,
                  title: data.chart_title || 'AI Chart Visualization',
                  data: data.chart_data,
                  reason: data.explanation
                }}
              />
            </div>
            {onAddChart && (
              <button
                type="button"
                onClick={() => handlePinChart(msgIdx, data)}
                disabled={isPinned}
                className={`w-full text-xs font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  isPinned
                    ? 'bg-[#22A06B]/15 text-[#22A06B] border border-[#22A06B]/40 cursor-default'
                    : 'bg-[#FF6B00] text-white hover:bg-[#e56000] shadow-sm'
                }`}
              >
                {isPinned ? (
                  <>
                    <Check size={14} />
                    <span>Pinned to Dashboard!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    <span>Pin Chart to Dashboard</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Table Fallback or Query Results Table */}
        {data.rows?.length > 0 && (!hasChart || data.rows.length <= 10) && (
          <div className="overflow-x-auto rounded-xl border border-[#FFB800]/50 bg-white">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-[#FFFDF5] border-b border-[#FFB800]/50">
                  {data.columns?.map(c => (
                    <th key={c} className="px-3 py-1.5 text-left text-[#172033] font-extrabold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows?.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-[#FFB800]/10 font-medium">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-[#172033]">{cell ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.rows?.length > 10 && (
          <p className="text-[11px] text-[#536482] font-medium">{data.rows.length - 10} more rows not shown</p>
        )}
      </div>
    )
  }

  return (
    <div className="card flex flex-col h-[520px] bg-white border border-[#FFB800]/40 shadow-xl">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="w-6 h-6 bg-[#FF6B00] rounded-lg flex items-center justify-center text-white">
          <BarChart2 size={14} />
        </div>
        <h3 className="text-sm font-extrabold text-[#172033]">AI Chart & Query Assistant</h3>
        <span className="tag ml-auto text-[10px]">Groq AI</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-[#536482] hover:text-[#172033] hover:bg-slate-100 rounded-lg transition-colors ml-1"
            title="Close chatbot"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs text-[#536482] font-bold">Ask AI to create charts or answer questions:</p>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-left text-xs text-[#172033] bg-[#FFFDF5] hover:bg-[#FFB800]/25 rounded-xl px-3 py-2.5 transition-colors border border-[#FFB800]/50 font-semibold flex items-center justify-between"
              >
                <span>{s}</span>
                <Sparkles size={12} className="text-[#FF6B00] shrink-0" />
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[92%] rounded-xl px-3.5 py-2 text-sm
              ${m.role === 'user'
                ? 'bg-[#FF6B00] text-white rounded-br-sm font-semibold shadow-sm'
                : 'bg-slate-100 border border-[#FFB800]/40 text-[#172033] rounded-bl-sm'}`}
            >
              {m.role === 'user' ? m.text :
                m.error ? <span className="text-[#E5484D] font-bold">{m.error}</span> :
                  renderResult(m.data, i)
              }
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-[#FFB800] flex items-center justify-center shrink-0 mt-0.5">
                <User size={12} className="text-[#172033]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
              <Bot size={12} className="text-white" />
            </div>
            <div className="bg-slate-100 border border-[#FFB800]/40 rounded-xl rounded-bl-sm px-3 py-2 text-xs font-bold text-[#536482] flex items-center gap-2">
              <Loader size={14} className="text-[#FF6B00] animate-spin" />
              <span>Analyzing columns & creating chart...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <input
          className="input-field"
          placeholder="e.g. Draw a bar chart of sales by product"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(input)}
          disabled={loading}
        />
        <button
          className="btn-primary px-3.5"
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
