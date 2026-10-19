import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";

const WS_BASE = "ws://https://nearevent-api.onrender.com/api/v1/notifications/ws";

export function useNotificationSocket(onMessage: (data: any) => void) {
  const token = useAuthStore((s) => s.token);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);

  ws.onmessage = (ev) => {
    try {
      onMessageRef.current(JSON.parse(String(ev.data)));
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