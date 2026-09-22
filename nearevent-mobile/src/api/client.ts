import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Android emulator: 10.0.2.2
// iOS simulator: localhost
// Physical device: your PC LAN IP
export const API_BASE_URL = "http://10.0.2.2:8080/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});