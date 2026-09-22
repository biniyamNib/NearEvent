import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  activateUser,
  getAdminUser,
  suspendUser,
  type AdminUser,
} from "../../../api/adminUsers.api";
import Button from "../../../components/ui/Button";
import Toast from "../../../components/ui/Toast";

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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-bg-default p-4 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-border-default px-5 py-3 last:border-b-0">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-default px-5 py-3 last:border-b-0">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export default function AdminUserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAdminUser(id);
      setUser(data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load user", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return <div className="text-text-secondary">Loading user details...</div>;
  }

  if (!user) {
    return <div className="text-status-error">User not found</div>;
  }

  const isActive = user.status === "active";
  const isOrganizer = user.role === "organizer";
  const isAttendee = user.role === "attendee";

  const roleLabel = isOrganizer
    ? "Organizer"
    : isAttendee
    ? "Attendee"
    : user.role || "User";

  // Optional stats (0 until backend provides them)
  const savedEvents = (user as any).saved_events_count ?? 0;
  const registeredEvents = (user as any).registered_events_count ?? 0;
  const upcomingRegistered = (user as any).upcoming_registered_count ?? 0;
  const pastRegistered = (user as any).past_registered_count ?? 0;

  const eventsCreated = (user as any).events_created ?? 0;
  const publishedEvents = (user as any).published_events ?? 0;
  const pendingEvents = (user as any).pending_events ?? 0;
  const cancelledEvents = (user as any).cancelled_events ?? 0;
  const totalRegistrations = (user as any).total_registrations ?? 0;

  const joinedLabel = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const confirmTitle = isActive
    ? `Suspend ${roleLabel}?`
    : `Activate ${roleLabel}?`;

  const confirmBody = isActive
    ? isOrganizer
      ? `Are you sure you want to suspend “${user.full_name}”? They will no longer be able to access their account or manage events.`
      : `Are you sure you want to suspend “${user.full_name}”? They will no longer be able to access their account.`
    : `Are you sure you want to activate “${user.full_name}”? They will regain access to their account.`;

  const onConfirmAction = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = isActive ? await suspendUser(id) : await activateUser(id);
      setUser(updated);
      setConfirmOpen(false);
      showToast(
        isActive
          ? `${roleLabel} suspended successfully!`
          : `${roleLabel} activated successfully!`
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

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
        onClick={() => navigate("/admin/users")}
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        ← Back
      </button>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">
            {user.full_name}
          </h1>
          <StatusPill status={user.status} />
        </div>
        <p className="mt-1 text-sm text-text-secondary">{roleLabel}</p>
      </div>

      {/* Stats */}
      {isOrganizer ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Events Created" value={eventsCreated} />
          <StatCard label="Published" value={publishedEvents} />
          <StatCard label="Registrations" value={totalRegistrations} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Saved Events" value={savedEvents} />
          <StatCard label="Registered Events" value={registeredEvents} />
          <StatCard label="Joined" value={joinedLabel} />
        </div>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Account Information */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Account Information
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default shadow-sm">
            <InfoRow label="Full Name" value={user.full_name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Role" value={roleLabel} />
            <InfoRow
              label="Status"
              value={user.status === "active" ? "Active" : "Suspended"}
            />
            <InfoRow label="Joined On" value={joinedLabel} />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {isOrganizer ? "Event Summary" : "Participation Summary"}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default shadow-sm">
            {isOrganizer ? (
              <>
                <SummaryRow label="Pending events" value={pendingEvents} />
                <SummaryRow label="Published events" value={publishedEvents} />
                <SummaryRow label="Cancelled events" value={cancelledEvents} />
                <SummaryRow
                  label="Total registrations"
                  value={totalRegistrations}
                />
              </>
            ) : (
              <>
                <SummaryRow
                  label="Upcoming registered events"
                  value={upcomingRegistered}
                />
                <SummaryRow
                  label="Past registered events"
                  value={pastRegistered}
                />
                <SummaryRow label="Saved events" value={savedEvents} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      <div>
        <Button
          variant={isActive ? "danger" : "primary"}
          onClick={() => setConfirmOpen(true)}
        >
          {isActive ? `Suspend ${roleLabel}` : `Activate ${roleLabel}`}
        </Button>
      </div>

      {/* Confirm modal */}
      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border-default bg-bg-default p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-text-primary">
                {confirmTitle}
              </h3>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmOpen(false)}
                className="text-text-tertiary hover:text-text-primary disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-text-secondary">{confirmBody}</p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={actionLoading}
                onClick={() => setConfirmOpen(false)}
              >
                {isActive ? "Keep Active" : "Keep Suspended"}
              </Button>
              <Button
                type="button"
                variant={isActive ? "danger" : "primary"}
                disabled={actionLoading}
                onClick={onConfirmAction}
              >
                {actionLoading
                  ? isActive
                    ? "Suspending..."
                    : "Activating..."
                  : isActive
                  ? `Suspend ${roleLabel}`
                  : `Activate ${roleLabel}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}