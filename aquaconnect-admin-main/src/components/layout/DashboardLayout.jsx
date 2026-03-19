import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, nav, pageMeta, role, name, roleLabel }) {
  return (
    <div className="flex h-screen bg-[#020f1a] text-[#e8f4f0] overflow-hidden">
      <Sidebar nav={nav} role={role} name={name} roleLabel={roleLabel} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar pageMeta={pageMeta} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}