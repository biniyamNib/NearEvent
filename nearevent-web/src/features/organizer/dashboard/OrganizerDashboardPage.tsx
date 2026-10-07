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
import { formatEventDateTime } from "../../../utils/formatDate";

function getEventHint(current: number | null, previous: number | null): string | null {
  if (current != null && previous != null) {
    if (current > previous) {
      return `+${current - previous} this month`;
    } else if (current < previous) {
      return `-${previous - current} this month`;
    }
  }
  return null;
}

export default function OrganizerDashboardPage() {
  const [stats, setStats] = useState<OrganizerDashboardStats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, eventsData] = await Promise.all([getOrganizerDashboard(),getOrganizerEvents(),]);
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
          hint={getEventHint(stats?.current_month_events ?? null, stats?.previous_month_events ?? null)}
        />
        <StatsCard
          label="Published Events"
          value={stats?.published_events ?? 0}
          hint={getEventHint(stats?.current_month_events ?? null, stats?.previous_month_events ?? null)}
        />
        <StatsCard
          label="Total Registrations"
          value={stats?.total_registrations ?? 0}
          hint={getEventHint(stats?.current_month_events ?? null, stats?.previous_month_events ?? null)}
        />
        <StatsCard
          label="Pending Events"
          value={stats?.pending_events ?? 0}
          hint={getEventHint(stats?.current_month_events ?? null, stats?.previous_month_events ?? null)}
        />
      </div>

      {/* Events section */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Your Events
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default">
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm md:min-w-full">
              <thead className="bg-bg-subtle text-text-secondary">
                <tr>
                  <th className="px-3 py-2 text-left font-medium md:px-5 md:py-3">
                    Event
                  </th>
                  <th className="px-3 py-2 text-left font-medium md:px-5 md:py-3">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-medium md:px-5 md:py-3">
                    Status
                  </th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell md:px-5 md:py-3">
                    Registrations
                  </th>
                  <th className="px-3 py-2 text-left font-medium md:px-5 md:py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-text-secondary md:px-5"
                    >
                      No events yet. Create your first event.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="border-t border-border-default">
                      <td className="px-3 py-3 md:px-5 md:py-4">
                        <div className="font-medium text-text-primary">
                          {event.title}
                        </div>
                        <div className="text-xs text-text-tertiary line-clamp-1">
                          {event.address}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-text-secondary whitespace-nowrap md:px-5 md:py-4">
                        {formatEventDateTime(event.event_date, event.start_time)}
                      </td>

                      <td className="px-3 py-3 md:px-5 md:py-4">
                        <StatusBadge status={event.status} />
                      </td>

                      <td className="hidden px-3 py-3 text-text-secondary whitespace-nowrap md:table-cell md:px-5 md:py-4">
                        {`${event.registrations_count ?? 0} registered`}
                      </td>

                      <td className="px-3 py-3 md:px-5 md:py-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
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