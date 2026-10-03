import React from "react";
import { Link, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import FeaturePlaceholderPage from "./pages/FeaturePlaceholderPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import BookingFormPage from "./pages/BookingFormPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import ProviderServicesPage from "./pages/ProviderServicesPage";
import ProviderBookingsPage from "./pages/ProviderBookingsPage";
import BookingReviewPage from "./pages/BookingReviewPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminServicesPage from "./pages/AdminServicesPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import PublicProviderPage from "./pages/PublicProviderPage";
import AdminReviewsPage from "./pages/AdminReviewsPage";

function NotFoundPage() {
  return (
    <section className="panel">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="button" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/services" element={<ServicesPage />} />

        <Route
          path="/services/:serviceId"
          element={<ServiceDetailsPage />}
        />

        <Route
          path="/providers/:providerId"
          element={<PublicProviderPage />}
        />
        
        {/* Shared authenticated pages */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />
        </Route>

        {/* Customer pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["customer"]} />
          }
        >
          <Route
            path="/services/:serviceId/book"
            element={<BookingFormPage />}
          />

          <Route
            path="/bookings"
            element={<MyBookingsPage />}
          />

          <Route
            path="/bookings/:bookingId/review"
            element={<BookingReviewPage />}
          />
        </Route>

        {/* Provider pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["provider"]} />
          }
        >
          <Route
            path="/provider/services"
            element={<ProviderServicesPage />}
          />

          <Route
            path="/provider/bookings"
            element={<ProviderBookingsPage />}
          />

          <Route
            path="/provider/profile"
            element={<ProviderProfilePage />}
          />
        </Route>

        {/* Administrator pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]} />
          }
        >
          <Route
            path="/admin/users"
            element={<AdminUsersPage />}
          />

          <Route path="/admin/services" element={<AdminServicesPage />} />

          <Route path="/admin/bookings" element={<AdminBookingsPage />} />

          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}