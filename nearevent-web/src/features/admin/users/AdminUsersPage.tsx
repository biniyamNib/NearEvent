import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers, type AdminUser } from "../../../api/adminUsers.api";
import Toast from "../../../components/ui/Toast";

type TabKey = "all" | "attendee" | "organizer";

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-status-success-light text-status-success"
          : "bg-status-error-light text-status-error"
      }`}
    >
      {active ? "Active" : "Suspended"}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminUsers();
        setUsers(data || []);
      } catch (err: any) {
        showToast(err?.response?.data?.message || "Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      // Hide admin accounts from this management list
      if (u.role === "admin") return false;

      if (tab === "attendee" && u.role !== "attendee") return false;
      if (tab === "organizer" && u.role !== "organizer") return false;

      if (status !== "all" && u.status !== status) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;

      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, tab, search, status]);

  const searchPlaceholder =
    tab === "attendee"
      ? "Search attendees..."
      : tab === "organizer"
      ? "Search organizers..."
      : "Search users...";

  if (loading) {
    return <div className="text-text-secondary">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
        <p className="mt-1 text-sm text-text-secondary">
          View and manage platform users
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-default">
        {[
          { key: "all", label: "All" },
          { key: "attendee", label: "Attendees" },
          { key: "organizer", label: "Organizers" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as TabKey)}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              tab === item.key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-64 rounded-xl border border-border-default bg-bg-default px-3 py-2.5 text-sm outline-none focus:border-border-focus"
        />

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-border-default bg-bg-default px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-subtle text-text-secondary">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Email</th>
                {tab === "all" ? (
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                ) : null}
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Joined On</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={tab === "all" ? 6 : 5}
                    className="px-5 py-8 text-center text-text-secondary"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-t border-border-default">
                    <td className="px-5 py-4 font-medium text-text-primary">
                      {user.full_name}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{user.email}</td>
                    {tab === "all" ? (
                      <td className="px-5 py-4 text-text-secondary capitalize">
                        {user.role}
                      </td>
                    ) : null}
                    <td className="px-5 py-4">
                      <StatusPill status={user.status} />
                    </td>
                    <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-brand-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}