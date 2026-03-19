'use client';

import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';

export default function PayModal({ bill, onClose, onConfirm, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { amount: bill?.amount },
  });

  if (!bill) return null;

  return (
    <Modal open={!!bill} onClose={onClose} title="Mark Bill as Paid">
      <div className="bg-[rgba(29,158,117,0.05)] border border-[rgba(29,158,117,0.12)] rounded-xl p-4 mb-5">
        <p className="text-xs text-[rgba(232,244,240,0.5)] mb-1">Customer</p>
        <p className="text-sm font-medium">{bill.customer.fullName}</p>
        <p className="text-[10px] text-[rgba(232,244,240,0.4)] mt-0.5">{bill.monthYear} — {bill.consumption} m³</p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[rgba(29,158,117,0.08)]">
          <span className="text-[10px] text-[rgba(232,244,240,0.4)]">Total Due</span>
          <span className="font-syne font-bold text-[#1D9E75]">{bill.amount} ETB</span>
        </div>
      </div>
      <form onSubmit={handleSubmit((d) => onConfirm(bill.id, parseFloat(d.amount)))}>
        <FormField label="Amount received (ETB)" error={errors.amount?.message}>
          <Input
            type="number"
            step="0.01"
            error={errors.amount}
            {...register('amount', {
              required: 'Amount is required.',
              min: { value: 0.01, message: 'Amount must be greater than 0.' },
            })}
          />
        </FormField>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm mt-2"
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </button>
      </form>
    </Modal>
  );
}