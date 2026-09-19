import { api } from "./client";
import type { AuthResponse, User } from "../types/auth.types";

type ApiSuccess<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  role?: "organizer" | "attendee";
};

export const login = async (payload: LoginPayload) => {
  const res = await api.post<ApiSuccess<AuthResponse>>("/auth/login", payload);
  return res.data.data;
};

export const register = async (payload: RegisterPayload) => {
  const res = await api.post<ApiSuccess<AuthResponse>>("/auth/register", payload);
  return res.data.data;
};

export const getMe = async () => {
  const res = await api.get<ApiSuccess<User>>("/auth/me");
  return res.data.data;
};

export const logout = async () => {
  const res = await api.post<ApiSuccess<null>>("/auth/logout");
  return res.data;
};