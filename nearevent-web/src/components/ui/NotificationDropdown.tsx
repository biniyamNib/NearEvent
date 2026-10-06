import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../../api/notifications.api";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";

function relativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: prepend new notification
  useNotificationSocket(
    useCallback((n: NotificationItem) => {
      setItems((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
    }, [])
  );

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const unread = items.filter((i) => !i.is_read).length;

  const onOpen = async () => {
    setOpen((v) => !v);
    if (!open) await load();
  };

  const onItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, is_read: true } : x))
        );
      } catch {
        // ignore
      }
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={onOpen}
        className="relative rounded-full p-2 text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border-default bg-bg-default shadow-lg">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Notifications
            </h3>
            <button
              type="button"
              onClick={onMarkAll}
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">
                No notifications yet
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemClick(item)}
                  className={`flex w-full gap-3 border-b border-border-default px-4 py-3 text-left hover:bg-bg-subtle ${
                    !item.is_read ? "bg-brand-primary-subtle/40" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      !item.is_read ? "bg-brand-primary" : "bg-transparent"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-primary">
                      {item.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-text-secondary">
                      {item.message}
                    </span>
                    <span className="mt-1 block text-[11px] text-text-tertiary">
                      {relativeTime(item.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}