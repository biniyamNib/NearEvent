import { api } from "./client";

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string; // attendee | organizer | admin
  status: string; // active | suspended
  created_at: string;
  avatar_url?: string | null;
};

export const getAdminUsers = async (params?: {
  role?: string;
  status?: string;
  q?: string;
}) => {
  const res = await api.get("/admin/users", { params });
  return res.data.data as AdminUser[];
};

export const getAdminUser = async (id: string) => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data.data as AdminUser;
};

export const suspendUser = async (id: string) => {
  const res = await api.post(`/admin/users/${id}/suspend`);
  return res.data.data;
};

export const activateUser = async (id: string) => {
  const res = await api.post(`/admin/users/${id}/activate`);
  return res.data.data;
};