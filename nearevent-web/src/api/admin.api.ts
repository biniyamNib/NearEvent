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