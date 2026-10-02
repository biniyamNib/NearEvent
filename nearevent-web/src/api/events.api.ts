import { api } from "./client";

type ApiSuccess<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type OrganizerDashboardStats = {
  total_events: number;
  pending_events: number;
  published_events: number;
  cancelled_events: number;
  total_registrations: number;
};

export type EventItem = {
  id: string;
  title: string;
  venue_name: string;
  address: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: string;
  capacity: number;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  category_id?: string;
  venue_name: string;
  address: string;
  event_date: string;
  start_time: string; 
  end_time: string;   
  capacity: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
};

export const getOrganizerDashboard = async () => {
  const res = await api.get<ApiSuccess<OrganizerDashboardStats>>("/organizer/dashboard");
  return res.data.data;
};

export const getOrganizerEvents = async () => {
  const res = await api.get<ApiSuccess<EventItem[]>>("/organizer/events");
  return res.data.data;
};

export const createEvent = async (payload: CreateEventPayload) => {
  const res = await api.post("/organizer/events", payload);
  return res.data.data;
};

export const updateEvent = async (id: string, payload: CreateEventPayload) => {
  const res = await api.put(`/organizer/events/${id}`, payload);
  return res.data.data;
};

export const getOrganizerEvent = async (id: string) => {
  const res = await api.get(`/organizer/events/${id}`);
  return res.data.data;
};

export const getEventRegistrations = async (id: string) => {
  const res = await api.get(`/organizer/events/${id}/registrations`);
  return res.data.data;
};

export const closeEventRegistration = async (id: string) => {
  const res = await api.post(`/organizer/events/${id}/close-registration`);
  return res.data.data;
};

export const reopenEventRegistration = async (id: string) => {
  const res = await api.post(`/organizer/events/${id}/reopen-registration`);
  return res.data.data;
};

export const cancelEvent = async (id: string) => {
  const res = await api.post(`/organizer/events/${id}/cancel`);
  return res.data.data;
};