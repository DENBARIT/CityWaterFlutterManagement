export default function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.4)] mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-[#E24B4A] mt-1">{error}</p>
      )}
    </div>
  );
}