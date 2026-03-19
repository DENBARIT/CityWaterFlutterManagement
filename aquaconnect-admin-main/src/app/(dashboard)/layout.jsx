import { SidebarProvider } from "@/store/sidebarStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { NAV, PAGE_META } from "@/constants/nav";
import RoleGuard from "@/features/auth/components/RoleGuard";

export default function Layout({ children }) {
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <SidebarProvider>
        <DashboardLayout
          nav={NAV}
          pageMeta={PAGE_META}
          role="SA"
          name="System Admin"
          roleLabel="SYSTEM_ADMIN"
        >
          {children}
        </DashboardLayout>
      </SidebarProvider>
    </RoleGuard>
  );
}
