export type UserRole = "attendee" | "organizer" | "admin";

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: string;
  avatar_url?: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};