import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import SideNavItem from "../components/ui/SideNavItem";
import { useAuthStore } from "../store/authStore";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const API_ORIGIN = "http://localhost:8080";

  const avatarSrc = user?.avatar_url
    ? user.avatar_url.startsWith("http") || user.avatar_url.startsWith("blob:")
      ? user.avatar_url
      : `${API_ORIGIN}${user.avatar_url}`
    : null;

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="h-screen overflow-hidden bg-bg-page flex flex-col">
      <header className="h-16 shrink-0 border-b border-border-default bg-bg-default px-4 md:px-6 flex items-center justify-between">
        <Logo className="text-xl" />
        <div className="h-9 w-9 overflow-hidden rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center text-sm font-semibold">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.full_name || "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 shrink-0 border-r border-border-default bg-bg-default px-4 py-5 flex flex-col">
          <nav className="space-y-1">
            <SideNavItem
              to="/admin/dashboard"
              label="Dashboard"
              icon={<LayoutDashboard size={18} />}
              active={location.pathname === "/admin/dashboard"}
            />
            <SideNavItem
              to="/admin/categories"
              label="Categories"
              icon={<Tags size={18} />}
              active={location.pathname.startsWith("/admin/categories")}
            />
            <SideNavItem
              to="/admin/users"
              label="Users"
              icon={<Users size={18} />}
              active={location.pathname.startsWith("/admin/users")}
            />
            <SideNavItem
              to="/admin/settings"
              label="Settings"
              icon={<Settings size={18} />}
              active={location.pathname === "/admin/settings"}
            />
          </nav>

          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="mt-auto flex items-center gap-2 px-3 py-2.5 text-sm text-status-error hover:opacity-80"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {logoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border-default bg-bg-default p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text-primary">Log Out</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to log out?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                  navigate("/login");
                }}
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}