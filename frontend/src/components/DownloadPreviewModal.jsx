import { useState } from 'react'
import { X, Download, FileText, CheckCircle2, Eye, Table, Layers, BarChart2 } from 'lucide-react'
import { downloadDataset } from '../utils/api'

export default function DownloadPreviewModal({ isOpen, onClose, onConfirmDownload, uploadData, charts = [] }) {
  const [downloadingCSV, setDownloadingCSV] = useState(false)

  if (!isOpen) return null

  const { filename, profile } = uploadData || {}

  const handleDownloadCSV = async () => {
    setDownloadingCSV(true)
    try {
      const res = await downloadDataset()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const outName = filename ? `${filename.replace(/\.[^/.]+$/, '')}_clean.csv` : 'dataset_clean.csv'
      link.setAttribute('download', outName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download CSV dataset. Ensure dataset is active.')
    } finally {
      setDownloadingCSV(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-md no-print animate-in fade-in duration-200">
      <div className="bg-white border border-[#FFB800]/40 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#172033]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#FFB800]/40 bg-[#FFFDF5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF6B00]/15 border border-[#FF6B00]/30 rounded-xl flex items-center justify-center text-[#FF6B00]">
              <Download size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#172033] tracking-tight">Download & Export File</h3>
              <p className="text-xs text-[#536482] font-medium">Preview clean file output before saving</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#536482] hover:text-[#172033] hover:bg-[#FFB800]/20 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#FFFDF5]/40">
          {/* Status Pills showing Heading Card & Summary Card removed */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-[#FFB800]/40 shadow-sm">
            <span className="text-xs font-bold text-[#172033] mr-1">Clean Export Filters:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#22A06B] text-xs font-bold rounded-lg">
              <CheckCircle2 size={13} />
              <span>Heading Card Removed</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#22A06B] text-xs font-bold rounded-lg">
              <CheckCircle2 size={13} />
              <span>Summary Card Removed</span>
            </div>
          </div>

          {/* Document Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-[#FF6B00]" />
                Live File Download Preview
              </label>
              <span className="text-[11px] text-[#536482] font-medium">Only KPI cards & Visual Charts included</span>
            </div>

            <div className="bg-white border border-[#FFB800]/40 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="text-[10px] text-[#FF6B00] font-extrabold tracking-wider uppercase mb-3 flex items-center gap-1">
                <FileText size={12} />
                <span>Document Canvas (Clean Layout)</span>
              </div>

              {/* Mini KPIs representation */}
              <div className="mb-4">
                <div className="text-[11px] font-bold text-[#172033] mb-2 flex items-center gap-1">
                  <Layers size={12} className="text-[#FFB800]" />
                  <span>Key Metrics Overview ({profile?.row_count?.toLocaleString() || '0'} rows)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#FFFDF5] border border-[#FFB800]/40 rounded-lg p-2 text-center">
                    <span className="block text-[10px] text-[#536482] font-bold">Total Rows</span>
                    <span className="text-xs font-extrabold text-[#172033]">{profile?.row_count?.toLocaleString() || '-'}</span>
                  </div>
                  <div className="bg-[#FFFDF5] border border-[#FFB800]/40 rounded-lg p-2 text-center">
                    <span className="block text-[10px] text-[#536482] font-bold">Columns</span>
                    <span className="text-xs font-extrabold text-[#FFB800]">{profile?.col_count || profile?.columns?.length || '-'}</span>
                  </div>
                  <div className="bg-[#FFFDF5] border border-[#FFB800]/40 rounded-lg p-2 text-center">
                    <span className="block text-[10px] text-[#536482] font-bold">Charts Included</span>
                    <span className="text-xs font-extrabold text-[#FF6B00]">{charts.length}</span>
                  </div>
                </div>
              </div>

              {/* Mini Charts representation */}
              <div>
                <div className="text-[11px] font-bold text-[#172033] mb-2 flex items-center gap-1">
                  <BarChart2 size={12} className="text-[#FF6B00]" />
                  <span>Visual Dashboard Charts ({charts.length} Grid Cards)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {charts.slice(0, 4).map((c, i) => (
                    <div key={i} className="bg-[#FFFDF5] border border-[#FFB800]/40 rounded-lg p-2.5 flex flex-col justify-between h-20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#172033] truncate max-w-[120px]">{c.title || `Chart ${i + 1}`}</span>
                        <span className="tag text-[9px] px-1 capitalize">{c.type}</span>
                      </div>
                      <div className="flex items-end gap-1 h-8 mt-1 border-b border-[#FFB800]/40 pb-1">
                        <div className="bg-[#FFB800] rounded-t w-1/4 h-[40%]" />
                        <div className="bg-[#FF6B00] rounded-t w-1/4 h-[80%]" />
                        <div className="bg-[#22A06B] rounded-t w-1/4 h-[60%]" />
                        <div className="bg-[#FF6B00] rounded-t w-1/4 h-[100%]" />
                      </div>
                    </div>
                  ))}
                  {charts.length === 0 && (
                    <div className="col-span-2 bg-[#FFFDF5] border border-[#FFB800]/40 rounded-lg p-4 text-center text-xs text-[#536482] font-medium">
                      No charts to render
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadCSV}
            disabled={downloadingCSV}
            className="btn-outline px-4 py-2.5 text-xs font-bold"
            title="Download raw dataset formatted as CSV file"
          >
            <Table size={15} />
            <span>{downloadingCSV ? 'Preparing CSV...' : 'Download CSV Dataset'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-ghost text-xs px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmDownload}
              className="btn-primary text-xs px-5 py-2.5"
            >
              <Download size={15} />
              <span>Download PDF / Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
