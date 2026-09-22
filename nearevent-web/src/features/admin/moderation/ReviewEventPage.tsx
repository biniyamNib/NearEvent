import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  approveEvent,
  getAdminEventFromPending,
  rejectEvent,
  requestEventChanges,
} from "../../../api/admin.api";
import StatusBadge from "../../../components/ui/StatusBadge";
import Toast from "../../../components/ui/Toast";

function formatDateTime(dateStr?: string, start?: string, end?: string) {
  if (!dateStr) return "—";
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    const dateLabel = date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

    const to12 = (t?: string) => {
      if (!t) return "";
      const [h, m] = t.slice(0, 5).split(":").map(Number);
      const d = new Date();
      d.setHours(h || 0, m || 0, 0, 0);
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    return `${dateLabel} · ${to12(start)} - ${to12(end)}`;
  } catch {
    return dateStr;
  }
}

export default function ReviewEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "reject" | "request" | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" } | null>(
    null
  );

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await getAdminEventFromPending(id);
        setEvent(data);
      } catch (err: any) {
        showToast(err?.response?.data?.message || err.message || "Failed to load event", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const imageUrl = useMemo(() => {
    if (!event?.image_url) return null;
    return event.image_url.startsWith("http")
      ? event.image_url
      : `http://localhost:8080${event.image_url}`;
  }, [event]);

  const runAction = async (type: "approve" | "reject" | "request") => {
    if (!id) return;

    if (type === "request" && !note.trim()) {
      showToast("Decision note is required to request changes", "error");
      return;
    }

    setAction(type);

    try {
      if (type === "approve") {
        const updated = await approveEvent(id);
        setEvent((prev: any) => ({ ...prev, ...updated }));
        showToast("Event approved!");
      } else if (type === "reject") {
        const updated = await rejectEvent(id, note.trim());
        setEvent((prev: any) => ({ ...prev, ...updated }));
        showToast(`${event?.title || "Event"} has been rejected!`);
      } else {
        const updated = await requestEventChanges(id, note.trim());
        setEvent((prev: any) => ({ ...prev, ...updated }));
        showToast(`The organizer has been asked to update ${event?.title || "the event"}!`);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Action failed", "error");
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return <div className="text-text-secondary">Loading event...</div>;
  }

  if (!event) {
    return <div className="text-status-error">Event not found</div>;
  }

  const isPending = event.status === "pending";

  return (
    <div className="space-y-6">
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => navigate("/admin/dashboard")}
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        ← Back
      </button>

      {/* Page header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Submitted on {new Date(event.created_at).toLocaleString()} by{" "}
          {event.organizer_name || "Unknown"}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* LEFT: Event Details */}
        <div className="xl:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Event Details</h2>

          <div className="rounded-2xl border border-border-default bg-bg-default p-5 shadow-sm space-y-4">
            <div className="overflow-hidden rounded-xl bg-bg-subtle aspect-video flex items-center justify-center text-sm text-text-tertiary">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                "No banner image"
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-text-tertiary">Date & Time</p>
                <p className="mt-1 text-sm text-text-primary">
                  {formatDateTime(event.event_date, event.start_time, event.end_time)}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-tertiary">Capacity</p>
                <p className="mt-1 text-sm text-text-primary">{event.capacity}</p>
              </div>

              <div>
                <p className="text-xs text-text-tertiary">Location</p>
                <p className="mt-1 text-sm text-text-primary">
                  {event.venue_name}, {event.address}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-tertiary">Category</p>
                <p className="mt-1 text-sm text-text-primary">
                  {event.category_name || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-tertiary">Description</p>
              <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Decision Panel */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Decision Panel</h2>

          <div className="rounded-2xl border border-border-default bg-bg-default p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs text-text-tertiary">Status</p>
              <p className="mt-1 text-sm font-medium text-text-primary capitalize">
                {String(event.status).replaceAll("_", " ")}
              </p>
            </div>

            <div>
              <p className="text-xs text-text-tertiary">Organizer</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                {event.organizer_name || "—"}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                Decision Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter feedback or reason..."
                rows={4}
                disabled={!isPending || action !== null}
                className="w-full rounded-xl border border-border-default px-3 py-2.5 text-sm outline-none transition focus:border-border-focus disabled:bg-bg-subtle"
              />
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={!isPending || action !== null}
                onClick={() => runAction("approve")}
                className="w-full rounded-xl bg-[#059669] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {action === "approve" ? "Approving..." : "Approve Event"}
              </button>

              <button
                type="button"
                disabled={!isPending || action !== null}
                onClick={() => runAction("request")}
                className="w-full rounded-xl bg-[#475569] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {action === "request" ? "Requesting..." : "Request Changes"}
              </button>

              <button
                type="button"
                disabled={!isPending || action !== null}
                onClick={() => runAction("reject")}
                className="w-full rounded-xl bg-[#E11D48] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {action === "reject" ? "Rejecting..." : "Reject Event"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}