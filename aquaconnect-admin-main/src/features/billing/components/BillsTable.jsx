'use client';

import EmptyState from '@/components/ui/EmptyState';
import PaymentFlagBadge from '@/features/users/components/PaymentFlagBadge';

const STATUS_STYLES = {
  PAID:      'bg-[rgba(29,158,117,0.12)] text-[#1D9E75]',
  UNPAID:    'bg-[rgba(239,159,39,0.12)] text-[#EF9F27]',
  OVERDUE:   'bg-[rgba(226,75,74,0.12)] text-[#E24B4A]',
  ESCALATED: 'bg-[rgba(212,83,126,0.15)] text-[#D4537E] font-bold',
  CANCELLED: 'bg-[rgba(136,135,128,0.12)] text-[#888780]',
};

export default function BillsTable({ bills, onPay, onWaive }) {
  if (!bills.length) return <EmptyState message="No bills found." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[rgba(29,158,117,0.06)]">
            {['Customer', 'Month', 'Consumption', 'Original', 'Penalty', 'Total', 'Status', 'Due Date', 'Actions'].map((h) => (
              <th key={h} className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-3 uppercase tracking-wider text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b.id} className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors">
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[rgba(29,158,117,0.12)] flex items-center justify-center text-[10px] font-syne font-bold text-[#1D9E75] shrink-0">
                    {b.customer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-[rgba(232,244,240,0.85)] leading-tight">{b.customer.fullName}</p>
                    <p className="text-[9px] text-[rgba(232,244,240,0.35)]">{b.customer.phoneE164}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]">{b.monthYear}</span>
              </td>
              <td className="py-3 pr-3 text-[rgba(232,244,240,0.6)]">{b.consumption} m³</td>
              <td className="py-3 pr-3 text-[rgba(232,244,240,0.6)]">{b.originalAmount} ETB</td>
              <td className="py-3 pr-3">
                {b.penaltyApplied ? (
                  <span className="text-[#E24B4A]">+{b.penaltyAmount} ETB</span>
                ) : (
                  <span className="text-[rgba(232,244,240,0.25)]">—</span>
                )}
              </td>
              <td className="py-3 pr-3 font-medium text-[rgba(232,244,240,0.85)]">{b.amount} ETB</td>
              <td className="py-3 pr-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${STATUS_STYLES[b.status]}`}>{b.status}</span>
              </td>
              <td className="py-3 pr-3 text-[rgba(232,244,240,0.4)]">
                {new Date(b.dueDate).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  {b.status !== 'PAID' && b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => onPay(b)}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.18)] transition-colors whitespace-nowrap"
                    >
                      Mark Paid
                    </button>
                  )}
                  {b.penaltyApplied && b.status !== 'PAID' && (
                    <button
                      onClick={() => onWaive(b)}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-[rgba(239,159,39,0.08)] text-[#EF9F27] hover:bg-[rgba(239,159,39,0.18)] transition-colors whitespace-nowrap"
                    >
                      Waive
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}