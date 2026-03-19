import { SidebarProvider } from "@/store/sidebarStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { WOREDA_NAV, WOREDA_PAGE_META } from "@/constants/woredaNav";
import RoleGuard from "@/features/auth/components/RoleGuard";

export default function WoredaLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["WOREDA_ADMINS", "WOREDA_ADMIN"]}>
      <SidebarProvider>
        <DashboardLayout
          nav={WOREDA_NAV}
          pageMeta={WOREDA_PAGE_META}
          role="WA"
          name="Biruk Alemu"
          roleLabel="WOREDA_ADMIN"
        >
          {children}
        </DashboardLayout>
      </SidebarProvider>
    </RoleGuard>
  );
}
