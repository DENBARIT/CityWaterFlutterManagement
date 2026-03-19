import BillsPage from '@/features/billing/components/BillsPage';
export default function UnpaidBillsPage() {
  return <BillsPage statusFilter="UNPAID" title="Unpaid Bills" />;
}