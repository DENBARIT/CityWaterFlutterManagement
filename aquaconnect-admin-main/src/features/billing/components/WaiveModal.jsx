'use client';

import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';

export default function WaiveModal({ bill, onClose, onConfirm, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (!bill) return null;

  return (
    <Modal open={!!bill} onClose={onClose} title="Waive Penalty">
      <div className="bg-[rgba(239,159,39,0.05)] border border-[rgba(239,159,39,0.15)] rounded-xl p-4 mb-5">
        <p className="text-xs text-[rgba(232,244,240,0.5)] mb-1">Penalty Details</p>
        <p className="text-sm font-medium">{bill.customer.fullName}</p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[rgba(239,159,39,0.08)]">
          <span className="text-[10px] text-[rgba(232,244,240,0.4)]">Penalty Amount</span>
          <span className="font-syne font-bold text-[#EF9F27]">{bill.penaltyAmount} ETB</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-[rgba(232,244,240,0.4)]">Bill reverts to</span>
          <span className="font-syne font-bold text-[#1D9E75]">{bill.originalAmount} ETB</span>
        </div>
      </div>
      <form onSubmit={handleSubmit((d) => onConfirm(bill.id, d.reason))}>
        <FormField label="Reason for waiving penalty" error={errors.reason?.message}>
          <textarea
            placeholder="Explain why the penalty is being waived..."
            {...register('reason', {
              required: 'Please provide a reason.',
              minLength: { value: 10, message: 'At least 10 characters required.' },
            })}
            className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl px-4 py-3 text-sm text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all resize-none h-24
              ${errors.reason ? 'border-[rgba(226,75,74,0.5)]' : 'border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)]'}`}
          />
          {errors.reason && <p className="text-[10px] text-[#E24B4A] mt-1">{errors.reason.message}</p>}
        </FormField>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[rgba(239,159,39,0.15)] border border-[rgba(239,159,39,0.3)] text-[#EF9F27] font-syne font-bold py-3 rounded-xl hover:bg-[rgba(239,159,39,0.25)] transition-all disabled:opacity-60 text-sm mt-2"
        >
          {loading ? 'Processing...' : 'Waive Penalty'}
        </button>
      </form>
    </Modal>
  );
}