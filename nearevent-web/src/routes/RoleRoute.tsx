import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types/auth.types";

type Props = {
  allow: UserRole[];
};

export default function RoleRoute({ allow }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}