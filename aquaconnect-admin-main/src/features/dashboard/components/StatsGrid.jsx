const DEFAULT_STATS = [
  { label: "Total Users", value: "0", change: "No data yet" },
  { label: "Active Meters", value: "0", change: "No data yet" },
  { label: "Bills Issued", value: "0", change: "No data yet" },
  { label: "Subcity Admins", value: "0", change: "No data yet" },
];
const STAT_ACCENTS = {
  "Total Users": "from-[#1D9E75] to-[#0D5A43]",
  "Active Meters": "from-[#378ADD] to-[#153B79]",
  "Bills Issued": "from-[#EF9F27] to-[#8A5311]",
  "Subcity Admins": "from-[#D4537E] to-[#6E2147]",
  "Complaint Officers": "from-[#A855F7] to-[#4C1D95]",
  "Billing Officers": "from-[#5DCAA5] to-[#0F766E]",
  Complaints: "from-[#F97316] to-[#9A3412]",
  Schedules: "from-[#60A5FA] to-[#1D4ED8]",
};

function getAccent(label) {
  return STAT_ACCENTS[label] || "from-[#1D9E75] to-[#0D5A43]";
}

export default function StatsGrid({ stats = DEFAULT_STATS, loading = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value, change }) => (
        <div
          key={label}
          className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#05141f] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(29,158,117,0.18)] hover:shadow-[0_18px_52px_rgba(0,0,0,0.26)]`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${getAccent(label)} opacity-80`}
          />
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[rgba(29,158,117,0.08)] blur-2xl transition-transform duration-300 group-hover:scale-125" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(232,244,240,0.35)] mb-2">
                {label}
              </p>
              <p className="font-syne text-3xl font-extrabold tracking-tight text-[#f4fbf8]">
                {loading ? "..." : value}
              </p>
              <p className="mt-2 text-xs text-[rgba(232,244,240,0.55)] leading-relaxed">
                {change}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(232,244,240,0.6)]">
                Live
              </span>
              <div className="flex items-end gap-1 h-10">
                {[34, 58, 46, 72].map((barHeight, index) => (
                  <span
                    key={`${label}-${index}`}
                    className={`w-1.5 rounded-full bg-gradient-to-t ${getAccent(label)} opacity-${60 + index * 10}`}
                    style={{ height: `${barHeight}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
