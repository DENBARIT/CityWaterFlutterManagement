export default function Input({ error, className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl px-4 py-3 text-sm
        text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all
        ${error
          ? 'border-[rgba(226,75,74,0.5)] focus:border-[rgba(226,75,74,0.7)]'
          : 'border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)] focus:bg-[rgba(29,158,117,0.07)]'
        } ${className}`}
    />
  );
}