import { SidebarProvider } from "@/store/sidebarStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { COMPLAINT_NAV, COMPLAINT_PAGE_META } from "@/constants/complaintNav";
import RoleGuard from "@/features/auth/components/RoleGuard";

export default function ComplaintLayout({ children }) {
  return (
    <RoleGuard
      allowedRoles={["SUBCITY_COMPLAINT_OFFICER", "WOREDA_COMPLAINT_OFFICER"]}
    >
      <SidebarProvider>
        <DashboardLayout
          nav={COMPLAINT_NAV}
          pageMeta={COMPLAINT_PAGE_META}
          role="CO"
          name="Hana Girma"
          roleLabel="COMPLAINT_OFFICER"
        >
          {children}
        </DashboardLayout>
      </SidebarProvider>
    </RoleGuard>
  );
}
