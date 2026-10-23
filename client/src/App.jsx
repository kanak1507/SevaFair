import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import CustomerDashboard from './pages/CustomerDashboard';
import CreateBooking from './pages/CreateBooking';
import WorkerDashboard from './pages/WorkerDashboard';
import OrganiserDashboard from './pages/OrganiserDashboard';
import AllocationDetails from './pages/AllocationDetails';

// Placeholder components for unimplemented routes to prevent errors
const Placeholder = ({ title }) => (
  <div className="card text-center py-12">
    <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
    <p className="text-slate-500">This page is part of the complete routing structure. Implement specific table/filter logic here as needed.</p>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Placeholder title="Login" />} />
        <Route path="/register" element={<Placeholder title="Register" />} />
        
        {/* Customer Routes */}
        <Route path="/customer" element={<DashboardLayout role="customer" />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="bookings/new" element={<CreateBooking />} />
          <Route path="bookings" element={<Placeholder title="My Bookings" />} />
          <Route path="bookings/:id" element={<Placeholder title="Booking Details" />} />
        </Route>

        {/* Worker Routes */}
        <Route path="/worker" element={<DashboardLayout role="worker" />}>
          <Route index element={<WorkerDashboard />} />
          <Route path="jobs" element={<Placeholder title="My Jobs" />} />
          <Route path="availability" element={<Placeholder title="Availability Management" />} />
        </Route>

        {/* Organiser Routes */}
        <Route path="/organiser" element={<DashboardLayout role="organiser" />}>
          <Route index element={<OrganiserDashboard />} />
          <Route path="workers" element={<Placeholder title="Manage Workers & Verification" />} />
          <Route path="bookings" element={<Placeholder title="Manage Bookings & Reassignment" />} />
          <Route path="history" element={<Placeholder title="Booking History & Audit Logs" />} />
          <Route path="analytics" element={<Placeholder title="Analytics" />} />
        </Route>

        {/* Shared Routes */}
        <Route path="/allocation" element={<DashboardLayout role="all" />}>
          <Route index element={<AllocationDetails />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}