import { useEffect, useState } from 'react'
import { BarChart2, Plus, Trash2, Calendar, FileText, Table, LogOut, ArrowRight, Loader, FolderKanban, Download } from 'lucide-react'
import { getProjects, deleteProject, getProject, downloadProjectDataset } from '../utils/api'
import ConfirmModal from '../components/ConfirmModal'

export default function ProjectsPage({ user, onSelectProject, onNewProject, onLogout }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [error, setError] = useState('')

  // Custom confirmation modal state
  const [projectToDelete, setProjectToDelete] = useState(null)

  const loadProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProjects()
      setProjects(res.data)
    } catch (err) {
      setError('Failed to load past projects. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const onRequestDelete = (e, project) => {
    e.stopPropagation()
    setProjectToDelete(project)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    const projectId = projectToDelete.id
    setDeletingId(projectId)
    try {
      await deleteProject(projectId)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      setProjectToDelete(null)
    } catch (err) {
      setError('Failed to delete project.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadDataset = async (e, project) => {
    e.stopPropagation()
    setDownloadingId(project.id)
    try {
      const res = await downloadProjectDataset(project.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const origName = project.filename || project.project_name || 'dataset'
      const baseName = origName.replace(/\.[^/.]+$/, '')
      link.setAttribute('download', `${baseName}_clean.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download dataset file for this project.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleOpenProject = async (projectId) => {
    try {
      const res = await getProject(projectId)
      onSelectProject(res.data)
    } catch (err) {
      alert('Failed to open project dashboard.')
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#172033]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-[#FFB800]/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF6B00] rounded-xl flex items-center justify-center shadow-sm shadow-[#FF6B00]/25">
            <BarChart2 size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-[#172033] text-lg tracking-tight">DataLens AI</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-[#536482] font-medium">
            Signed in as <span className="text-[#172033] font-bold">{user?.name || user?.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="btn-outline text-xs px-3.5 py-1.5"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#172033] flex items-center gap-3">
              <FolderKanban className="text-[#FF6B00]" size={28} />
              Your Projects
            </h1>
            <p className="text-[#536482] text-sm mt-1 font-medium">
              Select any past dataset to view its restored AI dashboard or download its cleaned dataset file.
            </p>
          </div>

          <button
            onClick={onNewProject}
            className="btn-primary px-5 py-2.5"
          >
            <Plus size={16} />
            Create New Project
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#536482]">
            <Loader size={24} className="text-[#FF6B00] animate-spin" />
            <p className="text-sm font-bold">Loading your projects...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-2xl text-[#E5484D] text-center font-bold">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-dashed border-[#FFB800]/50 rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-[#FFB800]/20 border border-[#FFB800]/40 rounded-2xl flex items-center justify-center mb-4 text-[#FF6B00]">
              <FolderKanban size={32} />
            </div>
            <h2 className="text-xl font-extrabold text-[#172033] mb-1">No Projects Found</h2>
            <p className="text-[#536482] text-sm max-w-md font-medium">
              You haven't created any projects yet. Click <span className="text-[#FF6B00] font-bold">"Create New Project"</span> in the top right to upload your dataset.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project.id)}
                className="group relative bg-white border border-[#FFB800]/40 hover:border-[#FF6B00] rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-extrabold text-lg text-[#172033] group-hover:text-[#FF6B00] transition-colors line-clamp-1">
                      {project.project_name}
                    </h3>
                    <button
                      onClick={(e) => onRequestDelete(e, project)}
                      disabled={deletingId === project.id}
                      className="p-1.5 text-[#536482] hover:text-[#E5484D] hover:bg-[#E5484D]/10 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      {deletingId === project.id ? (
                        <Loader size={15} className="animate-spin text-[#E5484D]" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-[#536482] mb-6 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[#FFB800] shrink-0" />
                      <span className="truncate">{project.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Table size={14} className="text-[#FFB800] shrink-0" />
                      <span>
                        {project.row_count?.toLocaleString()} rows · {project.column_count} columns
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#FFB800] shrink-0" />
                      <span>{formatDate(project.uploaded_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadDataset(e, project)}
                    disabled={downloadingId === project.id}
                    className="flex items-center gap-1.5 text-[#172033] hover:text-[#FF6B00] px-2.5 py-1.5 bg-[#FFFDF5] hover:bg-[#FFB800]/20 rounded-xl border border-[#FFB800]/50 transition-colors font-bold shrink-0 shadow-xs"
                    title="Download cleaned dataset file for this project"
                  >
                    {downloadingId === project.id ? (
                      <Loader size={13} className="animate-spin text-[#FF6B00]" />
                    ) : (
                      <Download size={13} className="text-[#FF6B00]" />
                    )}
                    <span>{downloadingId === project.id ? 'Downloading...' : 'Cleaned File'}</span>
                  </button>

                  <div className="flex items-center gap-1 text-[#FF6B00] group-hover:text-[#e56000] font-extrabold shrink-0">
                    <span>View Dashboard</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* In-App Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={projectToDelete ? `Are you sure you want to delete "${projectToDelete.project_name}"? This action cannot be undone and will permanently remove all project analytics and dataset files.` : ''}
        confirmText="Delete Project"
        loading={!!deletingId}
      />
    </div>
  )
}
