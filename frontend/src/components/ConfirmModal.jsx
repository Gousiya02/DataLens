import { Trash2, X } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white border border-[#FFB800]/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#536482] hover:text-[#172033] hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-2xl flex items-center justify-center text-[#E5484D] shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#172033]">{title || 'Confirm Action'}</h3>
            <p className="text-sm text-[#536482] font-medium mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-outline text-xs px-4 py-2 font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary text-xs px-4 py-2 bg-[#E5484D] hover:bg-red-600 font-bold shadow-md shadow-[#E5484D]/25"
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
