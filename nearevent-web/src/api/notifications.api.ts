// src/api/notifications.api.ts
import { api } from "./client";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  event_id?: string | null;
};

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return (res.data.data || []) as NotificationItem[];
};

export const markNotificationRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  await api.patch("/notifications/read-all");
};