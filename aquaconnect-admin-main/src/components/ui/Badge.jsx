const variants = {
  ACTIVE:    'bg-[rgba(29,158,117,0.12)] text-[#1D9E75]',
  INACTIVE:  'bg-[rgba(239,159,39,0.12)] text-[#EF9F27]',
  SUSPENDED: 'bg-[rgba(226,75,74,0.12)] text-[#E24B4A]',
};

export default function Badge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${variants[status] ?? variants.INACTIVE}`}>
      {status}
    </span>
  );
}