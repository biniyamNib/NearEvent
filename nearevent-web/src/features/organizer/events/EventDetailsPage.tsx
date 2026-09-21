import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelEvent,
  closeEventRegistration,
  reopenEventRegistration,
  getEventRegistrations,
  getOrganizerEvent,
  type EventItem,
} from "../../../api/events.api";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import StatsCard from "../../../components/ui/StatsCard";

type Registrant = {
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
};

function formatDateLabel(dateStr: string) {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  const clean = timeStr?.slice(0, 5) || "";
  const [h, m] = clean.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [closeOpen, setCloseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [eventData, regs] = await Promise.all([
        getOrganizerEvent(id),
        getEventRegistrations(id),
      ]);
      setEvent(eventData);
      setRegistrants(regs || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const registrationCount = registrants.length;
  const isPublished = event?.status === "published";
  const isClosed = event?.status === "registration_closed";
  const isCancelled = event?.status === "cancelled";

  const dateTimeLabel = useMemo(() => {
    if (!event) return "";
    return `${formatDateLabel(event.event_date)} · ${formatTime(
      event.start_time
    )} - ${formatTime(event.end_time)}`;
  }, [event]);

  const onCloseRegistration = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await closeEventRegistration(id);
      setEvent(updated);
      setSuccess("Registration closed successfully!");
      setCloseOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to close registration");
    } finally {
      setActionLoading(false);
    }
  };

  const onReopenRegistration = async () => {
    if (!id) return;
    setActionLoading(true);
    setError("");
    try {
      const updated = await reopenEventRegistration(id);
      setEvent(updated);
      setSuccess("Registration reopened successfully!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reopen registration");
    } finally {
      setActionLoading(false);
    }
  };

  const onCancelEvent = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await cancelEvent(id);
      setEvent(updated);
      setSuccess("Event cancelled successfully!");
      setCancelOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to cancel event");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-text-secondary">Loading event details...</div>;
  }

  if (!event) {
    return <div className="text-status-error">{error || "Event not found"}</div>;
  }

  const API_ORIGIN = "http://localhost:8080";

  const fullImageUrl = event.image_url
    ? event.image_url.startsWith("http")
      ? event.image_url
      : `${API_ORIGIN}${event.image_url}`
    : null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/organizer/dashboard")}
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        ← Back
      </button>

      {success ? (
        <div className="rounded-xl bg-status-success-light px-4 py-3 text-sm text-status-success">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-status-error-light px-4 py-3 text-sm text-status-error">
          {error}
        </div>
      ) : null}

      {/* Title */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">
          {event.title}
        </h1>
        <StatusBadge status={event.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left content */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Registrations"
              value={`${registrationCount}/${event.capacity}`}
            />
            <StatsCard
              label="Event Date"
              value={formatDateLabel(event.event_date)}
            />
            <StatsCard label="Status" value={event.status.replaceAll("_", " ")} />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-text-primary">
              Registrations
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-bg-subtle text-text-secondary">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Email</th>
                      <th className="px-5 py-3 text-left font-medium">
                        Registered On
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-8 text-center text-text-secondary"
                        >
                          No registrations yet.
                        </td>
                      </tr>
                    ) : (
                      registrants.map((r) => (
                        <tr
                          key={r.user_id}
                          className="border-t border-border-default"
                        >
                          <td className="px-5 py-3 text-text-primary">
                            {r.full_name}
                          </td>
                          <td className="px-5 py-3 text-text-secondary">
                            {r.email}
                          </td>
                          <td className="px-5 py-3 text-text-secondary">
                            {new Date(r.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isPublished ? (
            <Button
              type="button"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => setCloseOpen(true)}
            >
              Close Registration
            </Button>
          ) : null}

          {isClosed ? (
            <Button
              type="button"
              variant="secondary"
              disabled={actionLoading}
              onClick={onReopenRegistration}
            >
              {actionLoading ? "Reopening..." : "Reopen Registrations"}
            </Button>
          ) : null}
          </div>
        </div>

        {/* Right info panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-default bg-bg-default p-4 space-y-4">
            <h2 className="font-semibold text-text-primary">Event Information</h2>

            <div className="overflow-hidden rounded-xl bg-bg-subtle aspect-video flex items-center justify-center text-text-tertiary text-sm">
              {fullImageUrl ? (
                <img
                  src={fullImageUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                "No banner image"
              )}
            </div>

            <div>
              <p className="text-xs text-text-tertiary">Date & Time</p>
              <p className="text-sm text-text-primary">{dateTimeLabel}</p>
            </div>

            <div>
              <p className="text-xs text-text-tertiary">Location</p>
              <p className="text-sm text-text-primary">
                {event.venue_name}, {event.address}
              </p>
            </div>

            <div>
              <p className="text-xs text-text-tertiary">Capacity</p>
              <p className="text-sm text-text-primary">{event.capacity}</p>
            </div>

            <div>
              <p className="text-xs text-text-tertiary">About</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              disabled={isCancelled || actionLoading}
              onClick={() => setCancelOpen(true)}
            >
              Cancel Event
            </Button>
          </div>
        </div>
      </div>

      {/* Close Registration Modal */}
      {closeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-bg-default p-6 shadow-lg border border-border-default">
            <h3 className="text-lg font-semibold text-text-primary">
              Close Registration?
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to close registration for “{event.title}”?
              New attendees will no longer be able to register for this event.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setCloseOpen(false)}
                disabled={actionLoading}
              >
                Keep Open
              </Button>
              <Button
                variant="danger"
                onClick={onCloseRegistration}
                disabled={actionLoading}
              >
                {actionLoading ? "Closing..." : "Close Registration"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel Event Modal */}
      {cancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-bg-default p-6 shadow-lg border border-border-default">
            <h3 className="text-lg font-semibold text-text-primary">
              Cancel Event?
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to cancel “{event.title}”? This action
              cannot be undone. Registered attendees may be notified.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setCancelOpen(false)}
                disabled={actionLoading}
              >
                Keep Event
              </Button>
              <Button
                variant="danger"
                onClick={onCancelEvent}
                disabled={actionLoading}
              >
                {actionLoading ? "Cancelling..." : "Cancel Event"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}