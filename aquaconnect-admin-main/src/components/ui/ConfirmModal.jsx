import Modal from './Modal';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-[rgba(232,244,240,0.55)] font-light leading-relaxed mb-6">
        {message}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl text-xs border border-[rgba(232,244,240,0.1)] text-[rgba(232,244,240,0.5)] hover:text-[#e8f4f0] hover:border-[rgba(232,244,240,0.2)] transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2 rounded-xl text-xs bg-[rgba(226,75,74,0.15)] border border-[rgba(226,75,74,0.3)] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.25)] transition-all disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}