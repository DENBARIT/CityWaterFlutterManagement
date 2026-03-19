import { Fragment } from "react";

function humanizeRole(role) {
  if (!role) return "-";
  return role
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatLoginTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const periodRows = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "withinWeek", label: "Within a Week" },
];

export default function RecentAdminsTable({ adminsByPeriod, loading = false }) {
  const grouped = {
    today: adminsByPeriod?.today || [],
    yesterday: adminsByPeriod?.yesterday || [],
    withinWeek: adminsByPeriod?.withinWeek || [],
  };

  const hasAnyRows =
    grouped.today.length ||
    grouped.yesterday.length ||
    grouped.withinWeek.length;

  return (
    <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-sm tracking-tight">
          Recent Admins
        </h3>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[rgba(29,158,117,0.06)]">
            {["Name", "Email", "Role", "Last Login", "Status"].map((h) => (
              <th
                key={h}
                className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-2.5 pr-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="py-4 text-[rgba(232,244,240,0.5)]" colSpan={5}>
                Loading admins...
              </td>
            </tr>
          ) : hasAnyRows ? (
            periodRows.map((period) => {
              const rows = grouped[period.key] || [];
              if (!rows.length) return null;

              return (
                <Fragment key={period.key}>
                  <tr key={`${period.key}-heading`}>
                    <td
                      className="pt-3 pb-2 text-[10px] uppercase tracking-[0.14em] text-[#5DCAA5]"
                      colSpan={5}
                    >
                      {period.label}
                    </td>
                  </tr>
                  {rows.map((admin) => (
                    <tr
                      key={`${period.key}-${admin.id || admin.email}`}
                      className="border-b border-[rgba(29,158,117,0.04)]"
                    >
                      <td className="py-2.5 pr-4 text-[rgba(232,244,240,0.8)]">
                        {admin.fullName || "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-[rgba(232,244,240,0.5)]">
                        {admin.email || "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-[rgba(232,244,240,0.5)]">
                        {humanizeRole(admin.role)}
                      </td>
                      <td className="py-2.5 pr-4 text-[rgba(232,244,240,0.5)]">
                        {formatLoginTime(admin.lastLoginAt || admin.createdAt)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            admin.status === "ACTIVE"
                              ? "bg-[rgba(29,158,117,0.12)] text-[#1D9E75]"
                              : "bg-[rgba(239,159,39,0.12)] text-[#EF9F27]"
                          }`}
                        >
                          {admin.status || "UNKNOWN"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td className="py-4 text-[rgba(232,244,240,0.5)]" colSpan={5}>
                No admins found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
