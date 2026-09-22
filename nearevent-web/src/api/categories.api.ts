import { api } from "./client";

export type Category = {
  id: string;
  name: string;
  status: string;
  events_count?: number;
  updated_at?: string;
  created_at?: string;
};

// Public (for Create/Edit Event)
export const getActiveCategories = async () => {
  const res = await api.get("/categories");
  return res.data.data as Category[];
};

// Admin
export const getAdminCategories = async () => {
  const res = await api.get("/admin/categories");
  return res.data.data as Category[];
};

export const createCategory = async (name: string) => {
  const res = await api.post("/admin/categories", { name });
  return res.data.data;
};

export const updateCategory = async (id: string, name: string) => {
  const res = await api.put(`/admin/categories/${id}`, { name });
  return res.data.data;
};

export const setCategoryStatus = async (
  id: string,
  status: "active" | "inactive"
) => {
  const res = await api.patch(`/admin/categories/${id}/status`, { status });
  return res.data.data;
};

export const deleteCategory = async (id: string) => {
  const res = await api.delete(`/admin/categories/${id}`);
  return res.data;
};