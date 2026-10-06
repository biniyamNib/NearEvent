import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

const WS_BASE = "ws://localhost:8080/api/v1/notifications/ws";

export function useNotificationSocket(onMessage: (data: any) => void) {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);

    ws.onmessage = (ev) => {
      try {
        onMessage(JSON.parse(ev.data));
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      // optional: reconnect after 2s
    };

    return () => ws.close();
  }, [token, onMessage]);
}