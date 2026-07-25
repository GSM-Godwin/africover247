import { AdminSidebarContent } from "./admin-sidebar-content";

export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-midnight min-h-screen flex-col">
      <AdminSidebarContent />
    </aside>
  );
}
