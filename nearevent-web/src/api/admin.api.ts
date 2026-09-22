import { api } from "./client";

export const getAdminDashboard = async () => {
  const res = await api.get("/admin/dashboard");
  return res.data.data;
};

export const getPendingEvents = async () => {
  const res = await api.get("/admin/events/pending");
  return res.data.data;
};

export const approveEvent = async (id: string) => {
  const res = await api.post(`/admin/events/${id}/approve`);
  return res.data.data;
};

export const rejectEvent = async (id: string, reason = "") => {
  const res = await api.post(`/admin/events/${id}/reject`, { reason });
  return res.data.data;
};

// admin.api.ts
export const requestEventChanges = async (id: string, reason: string) => {
  const res = await api.post(`/admin/events/${id}/request-changes`, { reason });
  return res.data.data;
};

export const getAdminEventFromPending = async (id: string) => {
  const list = await getPendingEvents();
  const event = (list || []).find((e: any) => e.id === id);
  if (!event) throw new Error("Event not found in pending list");
  return event;
};