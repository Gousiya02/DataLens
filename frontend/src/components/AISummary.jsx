import { useEffect, useState } from 'react'
import { Sparkles, Loader } from 'lucide-react'
import { getSummary } from '../utils/api'

export default function AISummary({ initialSummary = '' }) {
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(!initialSummary)

  useEffect(() => {
    if (initialSummary) {
      setSummary(initialSummary)
      setLoading(false)
      return
    }
    getSummary()
      .then(r => setSummary(r.data.summary))
      .catch(() => setSummary('Summary unavailable. Check your Gemini API key.'))
      .finally(() => setLoading(false))
  }, [initialSummary])

  return (
    <div className="card bg-white border border-[#FFB800]/40">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-[#FF6B00]" />
        <span className="text-xs font-extrabold text-[#FF6B00] uppercase tracking-wide">AI Summary</span>
        <span className="tag ml-auto">Gemini AI</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-[#536482] text-sm font-semibold">
          <Loader size={14} className="animate-spin text-[#FF6B00]" />
          Generating insights...
        </div>
      ) : (
        <p className="text-[#172033] text-sm leading-relaxed font-semibold">{summary}</p>
      )}
    </div>
  )
}
