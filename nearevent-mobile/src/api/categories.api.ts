import { api } from "./client";

export const getActiveCategories = async () => {
  const res = await api.get("/categories");
  return res.data.data as { id: string; name: string }[];
};