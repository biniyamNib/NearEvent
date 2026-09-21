import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getOrganizerDashboard,
  getOrganizerEvents,
  type EventItem,
  type OrganizerDashboardStats,
} from "../../../api/events.api";
import StatsCard from "../../../components/ui/StatsCard";
import StatusBadge from "../../../components/ui/StatusBadge";

function formatEventDateTime(dateStr: string, timeStr: string) {
  try {
    // Handle values like "02:44:00.000000" or "14:00"
    const cleanTime = timeStr.slice(0, 5); // HH:MM
    const date = new Date(`${dateStr}T${cleanTime}:00`);

    if (Number.isNaN(date.getTime())) return `${dateStr} · ${cleanTime}`;

    return date.toLocaleString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    // Example: Sat, 24 Aug, 2:00 PM
  } catch {
    return `${dateStr} · ${timeStr}`;
  }
}

export default function OrganizerDashboardPage() {
  const [stats, setStats] = useState<OrganizerDashboardStats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, eventsData] = await Promise.all([
          getOrganizerDashboard(),
          getOrganizerEvents(),
        ]);
        setStats(dashboardData);
        setEvents(eventsData);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="text-text-secondary">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-status-error">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your events and track registrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Events"
          value={stats?.total_events ?? 0}
        />
        <StatsCard
          label="Published Events"
          value={stats?.published_events ?? 0}
        />
        <StatsCard
          label="Total Registrations"
          value={stats?.total_registrations ?? 0}
        />
        <StatsCard
          label="Pending Events"
          value={stats?.pending_events ?? 0}
        />
      </div>

      {/* Events section */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Your Events
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-subtle text-text-secondary">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Event</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">
                    Registrations
                  </th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-text-secondary"
                    >
                      No events yet. Create your first event.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-t border-border-default"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary">
                          {event.title}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {event.address}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                        {formatEventDateTime(event.event_date, event.start_time)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={event.status} />
                      </td>

                      <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                        {/* Backend list doesn't include count yet */}
                        {"registrations_count" in event
                          ? `${(event as any).registrations_count} registered`
                          : "0 registered"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <Link
                            to={`/organizer/events/${event.id}`}
                            className="text-brand-primary hover:underline"
                          >
                            View
                          </Link>
                          <Link
                            to={`/organizer/events/${event.id}/edit`}
                            className="text-brand-primary hover:underline"
                          >
                            Edit
                          </Link>
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