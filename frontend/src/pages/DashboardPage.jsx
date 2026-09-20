import { useEffect, useState } from 'react'
import { BarChart2, Plus, Loader, FolderKanban, LogOut, ArrowLeft, ShieldAlert, Download, MessageSquare, Bot, Trash2, CheckSquare, Square, Layers, RefreshCw } from 'lucide-react'
import KPICards from '../components/KPICards'
import ChartCard from '../components/ChartCard'
import ChatPanel from '../components/ChatPanel'
import AISummary from '../components/AISummary'
import AnomalyModal from '../components/AnomalyModal'
import ConfirmModal from '../components/ConfirmModal'
import { getCharts, getAnomalies, syncCharts } from '../utils/api'

export default function DashboardPage({ uploadData, onBackToProjects, onNewFile, onLogout }) {
  const [charts, setCharts] = useState(uploadData?.charts || [])
  const [anomalies, setAnomalies] = useState([])
  const [loadingCharts, setLoadingCharts] = useState(!uploadData?.charts?.length)
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Chart selection & deletion state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedChartIndices, setSelectedChartIndices] = useState(new Set())
  const [isConfirmDeleteChartsOpen, setIsConfirmDeleteChartsOpen] = useState(false)

  // Chart drag & drop reorder state
  const [draggedChartIndex, setDraggedChartIndex] = useState(null)
  const [dragOverChartIndex, setDragOverChartIndex] = useState(null)

  const { profile, filename, project_name, summary } = uploadData || {}

  const handleExportFile = () => {
    window.print()
  }

  useEffect(() => {
    if (uploadData?.charts?.length) {
      setCharts(uploadData.charts)
      setLoadingCharts(false)
      getAnomalies().then(r => setAnomalies(r.data.anomalies)).catch(() => { })
    } else {
      Promise.all([
        getCharts().then(r => setCharts(r.data.charts)),
        getAnomalies().then(r => setAnomalies(r.data.anomalies)),
      ]).catch(() => { }).finally(() => setLoadingCharts(false))
    }
  }, [uploadData])

  const saveUpdatedCharts = (nextCharts) => {
    setCharts(nextCharts)
    syncCharts(nextCharts).catch(() => { })
  }

  const handleMoveChart = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= charts.length || fromIndex === toIndex) return
    const nextCharts = [...charts]
    const [movedChart] = nextCharts.splice(fromIndex, 1)
    nextCharts.splice(toIndex, 0, movedChart)
    saveUpdatedCharts(nextCharts)
  }

  const handleDragStart = (e, index) => {
    setDraggedChartIndex(index)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedChartIndex !== index && dragOverChartIndex !== index) {
      setDragOverChartIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedChartIndex(null)
    setDragOverChartIndex(null)
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (draggedChartIndex !== null && draggedChartIndex !== targetIndex) {
      handleMoveChart(draggedChartIndex, targetIndex)
    }
    setDraggedChartIndex(null)
    setDragOverChartIndex(null)
  }

  const handleDeleteSingleChart = (chartToDelete, index) => {
    const nextCharts = charts.filter((_, idx) => idx !== index)
    saveUpdatedCharts(nextCharts)
    setSelectedChartIndices((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  const handleToggleSelectChart = (index) => {
    setSelectedChartIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (selectedChartIndices.size === charts.length) {
      setSelectedChartIndices(new Set())
    } else {
      setSelectedChartIndices(new Set(charts.map((_, idx) => idx)))
    }
  }

  const handleDeleteSelectedCharts = () => {
    if (selectedChartIndices.size === 0) return
    setIsConfirmDeleteChartsOpen(true)
  }

  const confirmDeleteSelectedCharts = () => {
    const nextCharts = charts.filter((_, idx) => !selectedChartIndices.has(idx))
    saveUpdatedCharts(nextCharts)
    setSelectedChartIndices(new Set())
    setIsSelectMode(false)
    setIsConfirmDeleteChartsOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#172033] relative">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur border-b border-[#FFB800]/40 no-print shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToProjects && (
            <button
              onClick={onBackToProjects}
              className="btn-outline text-xs px-3 py-1.5"
              title="Back to All Projects"
            >
              <ArrowLeft size={14} />
              <span>Back to Projects</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#FFB800]/50" />

          <div className="w-7 h-7 bg-[#FF6B00] rounded-lg flex items-center justify-center shadow-sm shadow-[#FF6B00]/25">
            <BarChart2 size={15} className="text-white" />
          </div>
          <span className="font-extrabold text-[#172033] text-sm tracking-tight">DataLens AI</span>
          <span className="text-[#536482]">·</span>
          <span className="text-[#172033] font-bold text-sm truncate max-w-[200px]">
            {project_name || filename}
          </span>
          {filename && project_name && (
            <span className="text-[#536482] text-xs font-medium truncate max-w-[150px]">
              ({filename})
            </span>
          )}
          <span className="tag">
            {profile?.row_count?.toLocaleString()} rows
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export File Button */}
          <button
            onClick={handleExportFile}
            className="btn-primary text-xs px-3.5 py-1.5"
            title="Export clean file output"
          >
            <Download size={14} />
            <span>Export File</span>
          </button>

          {onNewFile && (
            <button className="btn-ghost text-xs" onClick={onNewFile}>
              <Plus size={14} />
              New Project
            </button>
          )}
          {onLogout && (
            <button
              className="btn-outline text-xs px-3 py-1.5"
              onClick={onLogout}
            >
              <LogOut size={13} />
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-5 max-w-screen-2xl mx-auto w-full">
        {/* AI Summary */}
        <div className="mb-5 no-print">
          <AISummary initialSummary={summary} />
        </div>

        {/* Anomaly Detection Banner Bar */}
        <div className="bg-white border border-[#FFB800]/40 rounded-2xl p-4 mb-5 flex items-center justify-between shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-xl flex items-center justify-center text-[#E5484D] shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#172033]">Anomaly Detection</h4>
              <p className="text-xs text-[#536482] font-medium">
                {anomalies.length > 0
                  ? `${anomalies.length} statistical outliers detected in dataset`
                  : 'Scan dataset for statistical anomalies'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAnomalyModalOpen(true)}
            className="btn-primary text-xs px-4 py-2 shrink-0 bg-[#FF6B00] hover:bg-[#e56000]"
          >
            <ShieldAlert size={14} />
            <span>View Anomalies</span>
            {anomalies.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-[#E5484D] text-white">
                {anomalies.length}
              </span>
            )}
          </button>
        </div>

        {/* KPIs */}
        <KPICards profile={profile} />

        {/* Charts grid with Header Actions & Selection Controls */}
        <div className="w-full print-w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#FFB800]/40 rounded-2xl p-3.5 shadow-sm no-print">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#FFB800]/20 rounded-lg flex items-center justify-center text-[#FF6B00]">
                <Layers size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[#172033] text-sm">Visual Analytics & Charts</h3>
                  <span className="tag text-xs bg-[#FFFDF5] border-[#FFB800]/60">
                    {charts.length} {charts.length === 1 ? 'Chart' : 'Charts'}
                  </span>
                </div>
                <p className="text-[11px] text-[#536482] font-medium hidden sm:block">
                  Drag chart handles or use arrows to rearrange layout
                </p>
              </div>
            </div>

            {charts.length > 0 && (
              <div className="flex items-center gap-2">
                {isSelectMode && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="btn-outline text-xs px-3 py-1.5 font-bold"
                  >
                    {selectedChartIndices.size === charts.length ? <CheckSquare size={14} /> : <Square size={14} />}
                    <span>{selectedChartIndices.size === charts.length ? 'Deselect All' : 'Select All'}</span>
                  </button>
                )}

                {selectedChartIndices.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedCharts}
                    className="btn-primary text-xs px-3.5 py-1.5 bg-[#E5484D] hover:bg-red-600 font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 size={14} />
                    <span>Delete Selected ({selectedChartIndices.size})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode(!isSelectMode)
                    setSelectedChartIndices(new Set())
                  }}
                  className={`text-xs px-3.5 py-1.5 font-bold rounded-xl border transition-all ${isSelectMode
                    ? 'bg-[#172033] text-white border-[#172033]'
                    : 'bg-white text-[#172033] border-[#FFB800]/60 hover:bg-[#FFB800]/20'
                    }`}
                >
                  {isSelectMode ? 'Cancel Selection' : 'Select Charts'}
                </button>
              </div>
            )}
          </div>

          {loadingCharts ? (
            <div className="card flex items-center justify-center py-16 gap-3 bg-white">
              <Loader size={20} className="text-[#FF6B00] animate-spin" />
              <span className="text-[#536482] font-bold">Generating charts...</span>
            </div>
          ) : charts.length === 0 ? (
            <div className="card text-center py-12 bg-white border border-dashed border-[#FFB800]/50 rounded-2xl">
              <p className="text-[#172033] font-extrabold text-base">No charts available for this project.</p>
              <p className="text-[#536482] text-sm mt-1 font-medium max-w-md mx-auto">
                You can ask the AI Chatbot (bottom right) to generate new charts or re-upload your file.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print-chart-grid">
              {charts.map((chart, idx) => (
                <ChartCard
                  key={chart.id || `chart-${idx}`}
                  chart={chart}
                  index={idx}
                  totalCharts={charts.length}
                  onDelete={() => handleDeleteSingleChart(chart, idx)}
                  isSelectMode={isSelectMode}
                  isSelected={selectedChartIndices.has(idx)}
                  onToggleSelect={isSelectMode ? () => handleToggleSelectChart(idx) : undefined}
                  onMoveChart={handleMoveChart}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  isDragging={draggedChartIndex === idx}
                  isDragOver={dragOverChartIndex === idx}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Anomaly Detection Modal */}
      <AnomalyModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        anomalies={anomalies}
        filename={filename || project_name}
      />

      {/* Floating Bottom-Right Chatbot Widget Trigger */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-[420px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-2xl overflow-hidden border border-[#FFB800]/40 bg-white animate-in fade-in slide-in-from-bottom-4 duration-200">
            <ChatPanel
              onClose={() => setIsChatOpen(false)}
              onAddChart={(newChart) => setCharts(prev => [newChart, ...prev])}
            />
          </div>
        )}

        <button
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="btn-primary rounded-full px-4 py-3 text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          title="Open AI Chatbot Assistant"
        >
          <div className="relative">
            <MessageSquare size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFB800] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFB800] rounded-full" />
          </div>
          <span className="font-bold text-xs">Ask AI Chatbot</span>
        </button>
      </div>

      {/* Custom Confirmation Modal for Deleting Selected Charts */}
      <ConfirmModal
        isOpen={isConfirmDeleteChartsOpen}
        onClose={() => setIsConfirmDeleteChartsOpen(false)}
        onConfirm={confirmDeleteSelectedCharts}
        title="Delete Selected Charts"
        message={`Are you sure you want to delete ${selectedChartIndices.size} selected chart(s)? This action cannot be undone.`}
        confirmText="Delete Charts"
      />
    </div>
  )
}


