'use client';

import { useState } from 'react';
import ComplaintsPage from '@/features/complaint/components/ComplaintsPage';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const STATUS_STYLES = {
  OPEN:        'border-[rgba(226,75,74,0.3)] bg-[rgba(226,75,74,0.08)] text-[#E24B4A]',
  IN_PROGRESS: 'border-[rgba(239,159,39,0.3)] bg-[rgba(239,159,39,0.08)] text-[#EF9F27]',
  RESOLVED:    'border-[rgba(29,158,117,0.3)] bg-[rgba(29,158,117,0.08)] text-[#1D9E75]',
  CLOSED:      'border-[rgba(55,138,221,0.3)] bg-[rgba(55,138,221,0.08)] text-[#378ADD]',
};

export default function ComplaintsByStatusPage() {
  const [selectedStatus, setSelectedStatus] = useState('OPEN');

  return (
    <div className="text-[#e8f4f0]">
      <div className="flex items-center gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all
              ${selectedStatus === s
                ? STATUS_STYLES[s]
                : 'border-[rgba(29,158,117,0.1)] text-[rgba(232,244,240,0.4)] hover:text-[#e8f4f0] hover:border-[rgba(29,158,117,0.3)]'
              }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      <ComplaintsPage fixedStatus={selectedStatus} title={`${selectedStatus.replace('_', ' ')} Complaints`} />
    </div>
  );
}