import { SidebarProvider } from "@/store/sidebarStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BILLING_NAV, BILLING_PAGE_META } from "@/constants/billingNav";
import RoleGuard from "@/features/auth/components/RoleGuard";

export default function BillingLayout({ children }) {
  return (
    <RoleGuard
      allowedRoles={["SUBCITY_BILLING_OFFICER", "WOREDA_BILLING_OFFICER"]}
    >
      <SidebarProvider>
        <DashboardLayout
          nav={BILLING_NAV}
          pageMeta={BILLING_PAGE_META}
          role="BO"
          name="Dawit Bekele"
          roleLabel="BILLING_OFFICER"
        >
          {children}
        </DashboardLayout>
      </SidebarProvider>
    </RoleGuard>
  );
}
