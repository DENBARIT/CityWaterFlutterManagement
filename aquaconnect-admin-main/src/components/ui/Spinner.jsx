export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} border-2 border-[rgba(29,158,117,0.2)] border-t-[#1D9E75] rounded-full animate-spin`} />
  );
}