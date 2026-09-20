import { AlertTriangle, TrendingDown, TrendingUp, ExternalLink, ShieldAlert } from 'lucide-react'

export default function AnomalyPanel({ anomalies = [], onOpenModal }) {
  if (!anomalies?.length) return (
    <div className="card bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#536482]" /> Anomaly Detection
        </h3>
      </div>
      <p className="text-[#536482] text-sm font-medium">No anomalies detected in this dataset.</p>
    </div>
  )

  const previewList = anomalies.slice(0, 5)
  const remainingCount = anomalies.length - previewList.length

  return (
    <div className="card bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-[#172033] flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#E5484D]" />
          Anomalies Detected
          <span className="tag bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30">{anomalies.length}</span>
        </h3>

        {onOpenModal && (
          <button
            onClick={onOpenModal}
            className="btn-primary text-xs px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e56000]"
          >
            <span>View All ({anomalies.length})</span>
            <ExternalLink size={13} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {previewList.map((a, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl px-3.5 py-2.5 border text-sm font-semibold
              ${a.severity === 'high'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'}`}
          >
            <div className="mt-0.5">
              {a.direction === 'high' || a.direction === 'spike'
                ? <TrendingUp size={15} className="text-[#E5484D]" />
                : <TrendingDown size={15} className="text-[#FF6B00]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-[#172033]">
                {a.column} — {a.context}
              </p>
              <p className="text-[#172033] text-xs mt-0.5 font-medium">{a.what_is_it || a.message}</p>
            </div>
            <span className={`tag shrink-0 ${a.severity === 'high' ? 'bg-red-100 text-[#E5484D] border-red-300 font-extrabold' : 'bg-amber-100 text-[#FF6B00] border-amber-300 font-extrabold'}`}>
              {a.severity === 'high' ? 'High Outlier' : 'Unusual Value'}
            </span>
          </div>
        ))}
      </div>

      {remainingCount > 0 && onOpenModal && (
        <button
          onClick={onOpenModal}
          className="btn-outline w-full mt-3 py-2 text-xs font-bold justify-center"
        >
          <span>+{remainingCount} more anomalies in dataset file</span>
          <ExternalLink size={13} />
        </button>
      )}
    </div>
  )
}

