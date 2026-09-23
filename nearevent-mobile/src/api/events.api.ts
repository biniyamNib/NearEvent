import { api } from "./client";

export type EventItem = {
  id: string;
  title: string;
  description?: string;
  venue_name?: string;
  address?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  capacity?: number;
  image_url?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  status?: string;
};

export const getPublishedEvents = async (params?: {
  q?: string;
  category_id?: string;
}) => {
  const res = await api.get("/events", { params });
  return res.data.data as EventItem[];
};