export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-[rgba(29,158,117,0.06)]">
      <p className="text-[10px] text-[rgba(232,244,240,0.3)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-[10px] border border-[rgba(29,158,117,0.12)] text-[rgba(232,244,240,0.4)]
            hover:border-[rgba(29,158,117,0.3)] hover:text-[#e8f4f0] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg text-[10px] transition-all
              ${p === page
                ? 'bg-[#1D9E75] text-[#020f1a] font-bold'
                : 'border border-[rgba(29,158,117,0.12)] text-[rgba(232,244,240,0.4)] hover:border-[rgba(29,158,117,0.3)] hover:text-[#e8f4f0]'
              }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-[10px] border border-[rgba(29,158,117,0.12)] text-[rgba(232,244,240,0.4)]
            hover:border-[rgba(29,158,117,0.3)] hover:text-[#e8f4f0] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}