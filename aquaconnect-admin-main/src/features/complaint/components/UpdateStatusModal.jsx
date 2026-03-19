'use client';

import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import Select from '@/components/ui/Select';

const ALLOWED_STATUSES = ['IN_PROGRESS', 'RESOLVED'];

export default function UpdateStatusModal({ complaint, onClose, onConfirm, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { status: complaint?.status },
  });

  if (!complaint) return null;

  return (
    <Modal open={!!complaint} onClose={onClose} title="Update Complaint Status">
      <div className="bg-[rgba(29,158,117,0.05)] border border-[rgba(29,158,117,0.12)] rounded-xl p-4 mb-5">
        <p className="text-xs text-[rgba(232,244,240,0.5)] mb-1">Complaint</p>
        <p className="text-sm font-medium leading-snug">{complaint.title}</p>
        <p className="text-[10px] text-[rgba(232,244,240,0.4)] mt-1">
          Submitted by {complaint.submittedBy.fullName}
        </p>
      </div>
      <form onSubmit={handleSubmit((d) => onConfirm(complaint.id, d.status))}>
        <FormField label="New status" error={errors.status?.message}>
          <Select
            error={errors.status}
            {...register('status', { required: 'Please select a status.' })}
          >
            {ALLOWED_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </Select>
        </FormField>
        <p className="text-[10px] text-[rgba(232,244,240,0.3)] mb-4">
          Note: Only woreda admin can close a complaint.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </form>
    </Modal>
  );
}