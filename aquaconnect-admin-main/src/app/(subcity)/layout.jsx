import { SidebarProvider } from "@/store/sidebarStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SUBCITY_NAV, SUBCITY_PAGE_META } from "@/constants/subcityNav";
import RoleGuard from "@/features/auth/components/RoleGuard";

export default function SubcityLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["SUBCITY_ADMIN"]}>
      <SidebarProvider>
        <DashboardLayout
          nav={SUBCITY_NAV}
          pageMeta={SUBCITY_PAGE_META}
          role="SC"
          name="Selam Girma"
          roleLabel="SUBCITY_ADMIN"
        >
          {children}
        </DashboardLayout>
      </SidebarProvider>
    </RoleGuard>
  );
}
