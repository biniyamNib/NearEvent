import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveEvent,
  getAdminDashboard,
  getPendingEvents,
  rejectEvent,
} from "../../../api/admin.api";
import StatusBadge from "../../../components/ui/StatusBadge";

type DashboardStats = {
  pending_events: number;
  published_events: number;
  rejected_events: number;
  total_users: number;
};

type PendingEvent = {
  id: string;
  title: string;
  status: string;
  event_date: string;
  start_time: string;
  venue_name?: string;
  address?: string;
  category_id?: string | null;
  category_name?: string | null;
  organizer_name?: string;
  created_at: string;
};

function formatSubmittedOn(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [dashboard, pendingEvents] = await Promise.all([
        getAdminDashboard(),
        getPendingEvents(),
      ]);
      setStats(dashboard);
      setPending(pendingEvents || []);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await approveEvent(id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Approve failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const onReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await rejectEvent(id, "Rejected by admin");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Reject failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <div className="text-text-secondary">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of platform activity and moderation tasks
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-status-error-light px-4 py-3 text-sm text-status-error">
          {error}
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border-default bg-status-success-light p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Published Events</p>
          <p className="mt-2 text-2xl font-semibold text-status-success">
            {stats?.published_events ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-border-default bg-status-warning-light p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Pending Events</p>
          <p className="mt-2 text-2xl font-semibold text-status-warning">
            {stats?.pending_events ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-border-default bg-status-error-light p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Rejected Events</p>
          <p className="mt-2 text-2xl font-semibold text-status-error">
            {stats?.rejected_events ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-border-default bg-brand-primary-light p-4 shadow-sm">
          <p className="text-sm text-text-secondary">Total Users</p>
          <p className="mt-2 text-2xl font-semibold text-brand-primary">
            {stats?.total_users ?? 0}
          </p>
        </div>
      </div>

      {/* Pending moderation */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Pending Moderation
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-subtle text-text-secondary">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Event</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Submitted On</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-text-secondary"
                    >
                      No pending events
                    </td>
                  </tr>
                ) : (
                  pending.map((event) => (
                    <tr key={event.id} className="border-t border-border-default">
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary">
                          {event.title}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          by {event.organizer_name || "Unknown"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-text-secondary">
                        {event.category_name || "—"}
                      </td>

                      <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                        {formatSubmittedOn(event.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={event.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/admin/events/${event.id}`}
                            className="text-brand-primary hover:underline"
                          >
                            Review
                          </Link>

                          <button
                            className="text-status-success hover:underline disabled:opacity-50"
                            disabled={actionLoadingId === event.id}
                            onClick={() => onApprove(event.id)}
                          >
                            Approve
                          </button>

                          <button
                            className="text-status-error hover:underline disabled:opacity-50"
                            disabled={actionLoadingId === event.id}
                            onClick={() => onReject(event.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}