import { api } from "./client";

export type Category = {
  id: string;
  name: string;
  status: string;
};

export const getActiveCategories = async () => {
  const res = await api.get("/categories");
  return res.data.data as Category[];
};