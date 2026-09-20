import { useState, useRef } from 'react'
import { Upload, Zap, BarChart2, MessageSquare, AlertTriangle, ArrowLeft, FolderKanban, FileText, CheckCircle2, Sparkles } from 'lucide-react'
import { uploadFile } from '../utils/api'

export default function UploadPage({ onUploaded, onBackToProjects }) {
  const [projectName, setProjectName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const ALLOWED_POWERBI_EXTENSIONS = [
    '.csv', '.tsv', '.tab', '.psv',
    '.xlsx', '.xls', '.xlsm', '.xlsb', '.ods',
    '.json', '.jsonl', '.ndjson',
    '.xml',
    '.parquet', '.pq', '.feather', '.arrow', '.orc',
    '.sqlite', '.db', '.sqlite3'
  ]

  const handleFileSelect = (file) => {
    if (!file) return

    // Check if folder/directory
    const isDirectory = file.isDirectory || file.type === 'directory' || (file.size === 0 && !file.name.includes('.')) || file.webkitRelativePath?.includes('/')
    if (isDirectory) {
      setError('Folder uploads are not allowed. Please select a file(CSV, Excel, JSON, XML, Parquet, SQLite) data file.')
      setSelectedFile(null)
      return
    }

    const nameLower = file.name.toLowerCase()

    // Explicitly reject ZIP files / archives
    if (nameLower.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      setError('ZIP folders and archives are not allowed. Please extract the ZIP folder and select the data file (CSV, Excel, JSON, XML, Parquet, SQLite) inside.')
      setSelectedFile(null)
      return
    }

    // Check if extension is in allowed Power BI data source whitelist
    const isAllowed = ALLOWED_POWERBI_EXTENSIONS.some(ext => nameLower.endsWith(ext))

    if (!isAllowed) {
      setError('Unsupported file type. Accept only Power BI data sources: Excel (.xlsx, .xls), CSV (.csv), JSON (.json), XML (.xml), Parquet (.parquet), or SQLite (.db). ZIP folders, documents, images, PDFs, videos, and text files are rejected.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setError('')
    if (!projectName) {
      // Auto-generate clean project name from filename
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
      setProjectName(formattedName)
    }
  }

  const handleUpload = async (e) => {
    if (e) e.preventDefault()
    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await uploadFile(selectedFile, projectName)
      onUploaded(res.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : err.message || 'Upload failed. Check your file and try again.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)

    // Check if dropped item is a folder/directory
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry()
        if (entry && entry.isDirectory) {
          setError('Folders are not allowed. Please extract the folder and drop the data file inside.')
          setSelectedFile(null)
          return
        }
      }
    }

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative bg-[#FFFDF5] text-[#172033]">
      {/* Top navigation */}
      {onBackToProjects && (
        <div className="absolute top-6 left-6">
          <button
            onClick={onBackToProjects}
            className="btn-outline font-bold"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-9 h-9 bg-[#FF6B00] rounded-xl flex items-center justify-center shadow-md shadow-[#FF6B00]/25">
            <BarChart2 size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-[#172033] tracking-tight">DataLens AI</span>
        </div>
        <h1 className="text-4xl font-bold text-[#172033] mb-3 tracking-tight">
          Upload Dataset & Create Project
        </h1>
        <p className="text-[#536482] text-base max-w-lg mx-auto font-medium">
          Select any data file (Excel, CSV, JSON, XML, Parquet, SQLite), name your project, and launch your AI dashboard instantly.
        </p>
      </div>

      <form onSubmit={handleUpload} className="w-full max-w-xl space-y-6">
        {/* Step 1: File Selection Area */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#536482] mb-2">
            1. Select Dataset File
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.xlsm,.xlsb,.ods,.json,.jsonl,.ndjson,.xml,.parquet,.pq,.feather,.arrow,.orc,.sqlite,.db,.sqlite3,.tsv,.tab,.psv"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />

          {!selectedFile ? (
            <div
              className={`w-full border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                ${dragging ? 'border-[#FF6B00] bg-[#FFB800]/25 scale-[1.01]' : 'border-[#FFB800]/60 hover:border-[#FF6B00] bg-white shadow-sm hover:shadow-md'}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-[#FFB800]/20 border border-[#FFB800]/40 rounded-2xl flex items-center justify-center mb-1 text-[#FF6B00]">
                  <Upload size={26} />
                </div>
                <p className="text-[#172033] font-bold text-lg">Click to select or drop your dataset here</p>
                <span className="tag mt-1 text-xs px-3 py-1">Browse Data Files</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white border border-[#FFB800]/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 bg-[#FFB800]/20 border border-[#FFB800]/40 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-[#FF6B00]" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <p className="text-[#172033] font-bold text-sm truncate">{selectedFile.name}</p>
                    <CheckCircle2 size={15} className="text-[#22A06B] shrink-0" />
                  </div>
                  <p className="text-[#536482] text-xs font-medium mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB · File Ready
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-[#FF6B00] hover:text-[#e56000] font-bold px-3 py-1.5 bg-[#FFFDF5] border border-[#FFB800]/60 rounded-xl shrink-0 ml-2 hover:bg-[#FFB800]/20 transition-colors"
              >
                Change File
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Project Name Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#536482] mb-2">
            2. Project Name
          </label>
          <div className="relative">
            <FolderKanban className="absolute left-3.5 top-3.5 text-[#FFB800]" size={18} />
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Q3 Sales Performance Analytics"
              className="input-field pl-11 py-3"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[#E5484D] text-sm bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-xl px-4 py-3 w-full font-semibold">
            <AlertTriangle size={16} className="shrink-0 text-[#E5484D]" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 3: Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="btn-primary w-full py-3.5 text-base"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing data & generating dashboard...</span>
            </div>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Upload Dataset & Create Project</span>
            </>
          )}
        </button>
      </form>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-3 mt-10 justify-center">
        {[
          { icon: Zap, text: 'Auto chart generation' },
          { icon: AlertTriangle, text: 'Anomaly detection' },
          { icon: MessageSquare, text: 'Ask in plain English' },
          { icon: BarChart2, text: 'KPI cards' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 bg-white border border-[#FFB800]/40 rounded-full px-4 py-2 text-xs text-[#172033] font-bold shadow-sm">
            <Icon size={14} className="text-[#FF6B00]" />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
