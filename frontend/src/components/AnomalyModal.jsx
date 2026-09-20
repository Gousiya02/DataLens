import { useState, useMemo } from 'react'
import { AlertTriangle, X, Search, TrendingUp, TrendingDown, Filter, ShieldAlert, Zap, Layers } from 'lucide-react'

export default function AnomalyModal({ isOpen, onClose, anomalies = [], filename = '' }) {
  const [severityFilter, setSeverityFilter] = useState('all') // 'all', 'high', 'medium'
  const [searchQuery, setSearchQuery] = useState('')

  const stats = useMemo(() => {
    const high = anomalies.filter(a => a.severity === 'high').length
    const medium = anomalies.filter(a => a.severity === 'medium').length
    const uniqueCols = new Set(anomalies.map(a => a.column)).size
    return { total: anomalies.length, high, medium, uniqueCols }
  }, [anomalies])

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        a.column?.toLowerCase().includes(query) ||
        a.context?.toString().toLowerCase().includes(query) ||
        a.message?.toLowerCase().includes(query)
      return matchesSeverity && matchesSearch
    })
  }, [anomalies, severityFilter, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#172033]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-[#FFB800]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#172033]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#FFB800]/40 bg-[#FFFDF5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-xl flex items-center justify-center text-[#E5484D] shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#172033] tracking-tight">Anomaly Detection Center</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30">
                  {stats.total} {stats.total === 1 ? 'Anomaly' : 'Anomalies'} Detected
                </span>
              </div>
              <p className="text-xs text-[#536482] font-medium mt-0.5">
                Full statistical outlier analysis for <span className="text-[#172033] font-bold">{filename || 'Current Dataset'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#536482] hover:text-[#172033] hover:bg-[#FFB800]/20 rounded-xl transition-all"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-white border-b border-[#FFB800]/40 text-xs">
          <div className="bg-[#FFFDF5] border border-[#FFB800]/40 rounded-xl p-3 flex flex-col">
            <span className="text-[#536482] font-bold">Total File Anomalies</span>
            <span className="text-lg font-extrabold text-[#172033] mt-1">{stats.total}</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col">
            <span className="text-[#E5484D] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E5484D] animate-pulse" />
              High Severity
            </span>
            <span className="text-lg font-extrabold text-[#E5484D] mt-1">{stats.high}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col">
            <span className="text-[#FF6B00] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
              Medium Severity
            </span>
            <span className="text-lg font-extrabold text-[#FF6B00] mt-1">{stats.medium}</span>
          </div>
          <div className="bg-[#FFFDF5] border border-[#FFB800]/40 rounded-xl p-3 flex flex-col">
            <span className="text-[#536482] font-bold flex items-center gap-1">
              <Layers size={13} className="text-[#FF6B00]" />
              Affected Columns
            </span>
            <span className="text-lg font-extrabold text-[#FF6B00] mt-1">{stats.uniqueCols}</span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1.5 p-1 bg-[#FFFDF5] rounded-xl border border-[#FFB800]/40">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${severityFilter === 'all'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-[#536482] hover:text-[#172033]'
                }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setSeverityFilter('high')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${severityFilter === 'high'
                ? 'bg-[#E5484D] text-white shadow-sm'
                : 'text-[#536482] hover:text-[#172033]'
                }`}
            >
              High ({stats.high})
            </button>
            <button
              onClick={() => setSeverityFilter('medium')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${severityFilter === 'medium'
                ? 'bg-[#FFB800] text-[#172033] shadow-sm'
                : 'text-[#536482] hover:text-[#172033]'
                }`}
            >
              Medium ({stats.medium})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-2.5 text-[#FFB800]" />
            <input
              type="text"
              placeholder="Search column, row or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFDF5] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#536482] focus:outline-none focus:border-[#FFB800] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#536482] hover:text-[#172033] text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Friendly Plain English Explanation Banner */}
        <div className="mx-6 mt-4 p-3.5 bg-[#FFFDF5] border border-[#FFB800]/60 rounded-xl flex items-start gap-3">
          <div className="w-7 h-7 bg-[#FF6B00] text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Zap size={16} />
          </div>
          <div className="text-xs text-[#172033] space-y-0.5">
            <p className="font-extrabold text-[#172033]">What is an Anomaly & How to Fix It?</p>
            <p className="text-[#536482] font-medium leading-relaxed">
              An anomaly is an unusual number in your data (such as an extra zero typed by mistake, negative value, or sudden drop) that stands out from the rest of your file. Check the step-by-step fix suggestions below to correct your file.
            </p>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FFFDF5]/60">
          {filteredAnomalies.length === 0 ? (
            <div className="py-16 text-center text-[#536482] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#FFB800]/40 flex items-center justify-center text-[#FF6B00]">
                <AlertTriangle size={24} />
              </div>
              <p className="text-sm font-bold text-[#172033]">No anomalies found matching filter criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#FF6B00] hover:underline font-bold mt-1"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredAnomalies.map((a, i) => {
              const isHigh = a.severity === 'high'
              const isSpike = a.direction === 'high' || a.direction === 'spike'
              const whatLine = a.what_is_it || `Anomaly: '${a.column}' value (${a.value}) at ${a.context} is unusual vs average (${a.mean}).`
              const fixLine = a.how_to_fix || "Fix: Check source documents for typos, then update the value or delete invalid row."

              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all shadow-sm ${
                    isHigh
                      ? 'bg-red-50/90 border-red-200 hover:border-red-300'
                      : 'bg-amber-50/90 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  {/* Line 1: What is the anomaly */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`p-1 rounded-md shrink-0 ${isHigh ? 'bg-red-100 text-[#E5484D]' : 'bg-amber-100 text-[#FF6B00]'}`}>
                        {isSpike ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </span>
                      <p className="font-bold text-[#172033] truncate">
                        {whatLine}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${isHigh ? 'bg-[#E5484D] text-white' : 'bg-[#FF6B00] text-white'}`}>
                      {isHigh ? 'High Outlier' : 'Unusual Value'}
                    </span>
                  </div>

                  {/* Line 2: How to fix it */}
                  <div className="flex items-center gap-1.5 text-[#536482] font-semibold pl-6">
                    <Zap size={13} className="text-[#FF6B00] shrink-0" />
                    <p className="text-[#172033] font-medium truncate">
                      {fixLine.replace(/^Fix:\s*/i, 'Fix: ')}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-100">
          <span className="text-xs text-[#536482] font-medium">
            Showing {filteredAnomalies.length} of {anomalies.length} total anomalies detected in file
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-[#172033] text-white rounded-xl hover:bg-[#2a3a5a] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
