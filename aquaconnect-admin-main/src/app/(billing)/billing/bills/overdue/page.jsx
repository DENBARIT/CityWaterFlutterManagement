import BillsPage from '@/features/billing/components/BillsPage';
export default function OverdueBillsPage() {
  return <BillsPage statusFilter="OVERDUE" title="Overdue Bills" />;
}