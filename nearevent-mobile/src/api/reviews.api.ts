import { api } from "./client";
export const getEventReviews = async (id: string) => {
  const res = await api.get(`/events/${id}/reviews`);
  return res.data.data;
};

export const getRatingSummary = async (id: string) => {
  const res = await api.get(`/events/${id}/rating-summary`);
  return res.data.data;
};

export const createReview = async (
  id: string,
  payload: { rating: number; comment?: string }
) => {
  const res = await api.post(`/events/${id}/reviews`, payload);
  return res.data.data;
};