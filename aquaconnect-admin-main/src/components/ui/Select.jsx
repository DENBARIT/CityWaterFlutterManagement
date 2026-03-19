export default function Select({ error, className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl px-4 py-3 text-sm
        text-[#e8f4f0] outline-none transition-all appearance-none
        [&>option]:bg-white [&>option]:text-[#05141f]
        ${
          error
            ? "border-[rgba(226,75,74,0.5)]"
            : "border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)] focus:bg-[rgba(29,158,117,0.07)]"
        } ${className}`}
    >
      {children}
    </select>
  );
}
