import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import OrganizerDashboardPage from "../features/organizer/dashboard/OrganizerDashboardPage";
import AdminDashboardPage from "../features/admin/dashboard/AdminDashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import OrganizerLayout from "../layouts/OrganizerLayout";
import CreateEventPage from "../features/organizer/events/CreateEventPage";
import EventDetailsPage from "../features/organizer/events/EventDetailsPage";
import EditEventPage from "../features/organizer/events/EditEventPage";
import OrganizerSettingsPage from "../features/organizer/settings/OrganizerSettingsPage";
import AdminLayout from "../layouts/AdminLayout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allow={["organizer"]} />}>
            <Route element={<OrganizerLayout />}>
              <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
              <Route path="/organizer/events/create" element={<CreateEventPage />} />
              <Route path="/organizer/events/:id" element={<EventDetailsPage />} />
              <Route path="/organizer/events/:id/edit" element={<EditEventPage />} />
              <Route path="/organizer/settings" element={<OrganizerSettingsPage />} />
            </Route>  
          </Route>

          <Route element={<RoleRoute allow={["admin"]} />}>
            <Route element={<AdminLayout/>}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}