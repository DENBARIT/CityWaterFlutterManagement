export default function TariffCard({ tariff, loading = false }) {
  const sortedBlocks = Array.isArray(tariff?.blocks)
    ? [...tariff.blocks].sort((a, b) => Number(a.fromM3) - Number(b.fromM3))
    : [];

  const firstBlock = sortedBlocks[0] || null;
  const tariffType = String(tariff?.customerType || "RESIDENTIAL");

  return (
    <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-sm tracking-tight">
          Current Tariff
        </h3>
        <span className="text-[10px] px-2.5 py-1 rounded-full border border-[rgba(29,158,117,0.2)] text-[#9be5c9]">
          {tariffType.charAt(0) + tariffType.slice(1).toLowerCase()}
        </span>
      </div>
      <div className="bg-[rgba(29,158,117,0.05)] border border-[rgba(29,158,117,0.15)] rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="font-syne text-4xl font-extrabold text-[#1D9E75] tracking-tight">
            {loading
              ? "..."
              : firstBlock
                ? Number(firstBlock.pricePerM3).toFixed(2)
                : "-"}
          </p>
          <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-1">
            ETB / m³ (first tier)
          </p>
          {!loading && sortedBlocks.length > 0 ? (
            <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-2">
              {sortedBlocks.length} tier{sortedBlocks.length > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[rgba(232,244,240,0.3)]">
            Effective from
          </p>
          <p className="text-xs text-[#e8f4f0] mt-1">
            {loading
              ? "Loading..."
              : tariff
                ? new Date(tariff.effectiveFrom).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "No active tariff"}
          </p>
        </div>
      </div>
    </div>
  );
}
