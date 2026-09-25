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

export const getEventById = async (id: string) => {
  const res = await api.get(`/events/${id}`);
  return res.data.data;
};

export const rsvpEvent = async (id: string) => {
  const res = await api.post(`/events/${id}/rsvp`);
  return res.data.data;
};

export const cancelRsvp = async (id: string) => {
  const res = await api.delete(`/events/${id}/rsvp`);
  return res.data.data;
};

export const saveEvent = async (id: string) => {
  const res = await api.post(`/events/${id}/save`);
  return res.data.data;
};

export const unsaveEvent = async (id: string) => {
  const res = await api.delete(`/events/${id}/save`);
  return res.data.data;
};