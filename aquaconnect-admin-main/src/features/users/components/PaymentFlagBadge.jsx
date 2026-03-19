const FLAGS = {
  NONE:         { label: 'Clear', style: 'bg-[rgba(29,158,117,0.1)] text-[#1D9E75]' },
  WARNING:      { label: 'Warning', style: 'bg-[rgba(239,159,39,0.12)] text-[#EF9F27]' },
  CRITICAL:     { label: 'Critical', style: 'bg-[rgba(226,75,74,0.12)] text-[#E24B4A]' },
  LEGAL_ACTION: { label: 'Legal Action', style: 'bg-[rgba(226,75,74,0.2)] text-[#E24B4A] font-bold' },
};

export default function PaymentFlagBadge({ flag }) {
  const { label, style } = FLAGS[flag] ?? FLAGS.NONE;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${style}`}>
      {label}
    </span>
  );
}