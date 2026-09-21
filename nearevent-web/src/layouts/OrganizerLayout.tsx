import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Settings, LogOut } from "lucide-react";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import SideNavItem from "../components/ui/SideNavItem";
import { useAuthStore } from "../store/authStore";

export default function OrganizerLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-bg-page flex flex-col">
      {/* Top Navbar (full width) */}
      <header className="h-16 shrink-0 border-b border-border-default bg-bg-default px-4 md:px-6 flex items-center justify-between">
        <Logo className="text-xl" />

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/organizer/events/create")}>
            Create Event
          </Button>
          <div className="h-9 w-9 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border-default bg-bg-default px-4 py-5 flex flex-col">
          <nav className="space-y-1">
            <SideNavItem
              to="/organizer/dashboard"
              label="Dashboard"
              icon={<LayoutDashboard size={18} />}
              active={location.pathname === "/organizer/dashboard"}
            />
            <SideNavItem
              to="/organizer/events/create"
              label="Create Event"
              icon={<PlusCircle size={18} />}
              active={location.pathname.startsWith("/organizer/events/create")}
            />
            <SideNavItem
              to="/organizer/settings"
              label="Settings"
              icon={<Settings size={18} />}
              active={location.pathname === "/organizer/settings"}
            />
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-2 px-3 py-2.5 text-sm text-status-error hover:opacity-80"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}