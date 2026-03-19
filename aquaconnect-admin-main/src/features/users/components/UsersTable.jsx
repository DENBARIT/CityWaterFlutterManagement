"use client";

import Badge from "@/components/ui/Badge";
import PaymentFlagBadge from "./PaymentFlagBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function UsersTable({
  users,
  onToggleStatus,
  onEdit,
  onDelete,
  updatingUserId = "",
  deletingUserId = "",
}) {
  if (!users.length) return <EmptyState message="No users found." />;

  const showActions =
    typeof onToggleStatus === "function" ||
    typeof onEdit === "function" ||
    typeof onDelete === "function";

  const headers = [
    "Customer",
    "Contact",
    "Location",
    "Meter",
    "Status",
    "Payment",
    "Verified",
    "Joined",
  ];

  if (showActions) {
    headers.push("Action");
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[rgba(29,158,117,0.06)]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
            >
              {/* Customer */}
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[rgba(29,158,117,0.12)] flex items-center justify-center text-[10px] font-syne font-bold text-[#1D9E75] shrink-0">
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-[rgba(232,244,240,0.85)] leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[9px] text-[rgba(232,244,240,0.35)] mt-0.5">
                      {user.nationalId}
                    </p>
                  </div>
                </div>
              </td>

              {/* Contact */}
              <td className="py-3 pr-4">
                <p className="text-[rgba(232,244,240,0.55)]">{user.email}</p>
                <p className="text-[9px] text-[rgba(232,244,240,0.35)] mt-0.5">
                  {user.phoneE164}
                </p>
              </td>

              {/* Location */}
              <td className="py-3 pr-4">
                <p className="text-[rgba(232,244,240,0.55)]">
                  {user.subCity?.name ?? "—"}
                </p>
                <p className="text-[9px] text-[rgba(232,244,240,0.35)] mt-0.5">
                  {user.woreda?.name ?? "—"}
                </p>
              </td>

              {/* Meter */}
              <td className="py-3 pr-4">
                {user.meter ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] w-fit">
                      {user.meter.meterNumber}
                    </span>
                    <span className="text-[9px] text-[#7ce4be]">
                      Signed automatically
                    </span>
                  </div>
                ) : (
                  <span className="text-[rgba(232,244,240,0.25)] text-[10px]">
                    No meter
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="py-3 pr-4">
                <Badge status={user.status} />
              </td>

              {/* Payment Flag */}
              <td className="py-3 pr-4">
                <PaymentFlagBadge flag={user.paymentFlag} />
              </td>

              {/* Email Verified */}
              <td className="py-3 pr-4">
                <span
                  className={`text-[10px] ${user.emailVerified ? "text-[#1D9E75]" : "text-[rgba(232,244,240,0.3)]"}`}
                >
                  {user.emailVerified ? "✓ Verified" : "✗ Pending"}
                </span>
              </td>

              {/* Joined */}
              <td className="py-3 text-[rgba(232,244,240,0.4)]">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>

              {showActions && (
                <td className="py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeof onEdit === "function" && (
                      <button
                        onClick={() => onEdit(user)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-[#1D9E75] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.12)] transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {typeof onToggleStatus === "function" && (
                      <button
                        onClick={() =>
                          onToggleStatus(
                            user.id,
                            user.status === "SUSPENDED"
                              ? "ACTIVE"
                              : "SUSPENDED",
                          )
                        }
                        disabled={updatingUserId === user.id}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          user.status === "SUSPENDED"
                            ? "border-[#1D9E75] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.12)]"
                            : "border-[#E24B4A] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.12)]"
                        }`}
                      >
                        {updatingUserId === user.id
                          ? "Updating..."
                          : user.status === "SUSPENDED"
                            ? "Activate"
                            : "Suspend"}
                      </button>
                    )}
                    {typeof onDelete === "function" && (
                      <button
                        onClick={() => onDelete(user)}
                        disabled={deletingUserId === user.id}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-[#E24B4A] text-[#E24B4A] hover:bg-[rgba(226,75,74,0.12)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingUserId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
