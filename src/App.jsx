import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/Authcontext.jsx";
import { ProtectedRoute, AdminRoute, SupportRoute, PublicRoute } from "./components/ProtectedRoute.jsx";

// Core Components
import About from "./components/Candidate/About/About.jsx";
import Explore from "./components/Candidate/Explore/Explore.jsx";
import LongTrip from "./components/Candidate/Explore/LongTrip.jsx";
import OffRoading from "./components/Candidate/Explore/OffRoading.jsx";
import Services from "./components/Candidate/Services/Services.jsx";
import MainPage from "./components/MainPage.jsx";
import Navbar from "./components/Candidate/Navbar/Navbar.jsx";
import Login from "./components/Login.jsx";
import BookingConfirmation from "./components/Candidate/BookingConfirmation.jsx";
import Support from "./components/Candidate/Support.jsx";
import MyBookings from "./components/Candidate/Mybookings.jsx";
import Profile from "./components/Candidate/Profile.jsx";
import Footer from "./components/Footer.jsx"; 

// Admin Components
import BookingDetail from './components/Admin/BookingDetail.jsx'; 
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";
import UserManagement from "./components/Admin/UserManagement.jsx";
import BookingManagement from "./components/Admin/BookingManagement.jsx";
import TripManagement from "./components/Admin/Tripmanagement.jsx";

// Support Components
import SupportHistory from "./components/Support/SupportHistory.jsx";
import SupportDashboard from "./components/Support/SupportDashboard.jsx";
import TicketManagement from './components/Support/TicketManagement';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>

        {/* ── Public Routes ─────────────────────────────── */}
        <Route path="/"      element={<MainPage />} />
        <Route path="/home"  element={<MainPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/long-trip"   element={<LongTrip />} />
        <Route path="/explore/off-roading" element={<OffRoading />} />
        <Route path="/services" element={<Services />} />
        <Route path="/support"  element={<Support />} />
        <Route path="/footer"  element={<Footer />} />
   
        {/* ── Auth Routes ───────────────────────────────── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ── Protected User Routes ─────────────────────── */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-confirmation"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Routes ──────────────────────────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/add"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <AdminRoute>
              <TripManagement />
            </AdminRoute>
          }
        />

        {/* ── Booking Management (Admin + Support) ─────── */}
        <Route
          path="/admin/bookings"
          element={
            <SupportRoute>
              <BookingManagement />
            </SupportRoute>
          }
        />

        {/* THIS WAS THE BUG: It must map to BookingDetail, not BookingManagement! */}
        <Route
          path="/admin/bookings/:id"
          element={
            <SupportRoute>
              <BookingDetail />
            </SupportRoute>
          }
        />

        {/* ── Support Dashboard & Tickets ─────────────────── */}
        <Route
          path="/support/dashboard"
          element={
            <SupportRoute>
              <SupportDashboard />
            </SupportRoute>
          }
        />
        <Route
          path="/support/history"
          element={
            <SupportRoute>
              <SupportHistory />
            </SupportRoute>
          }
        />
        <Route 
          path="/admin/tickets" 
          element={
            <SupportRoute>
              <TicketManagement />
            </SupportRoute>
          } 
        />

        {/* ── Fallback ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  );
}