import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function CustomerDashboard() {
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const loadBookings = async () => {
setLoading(true);
setError('');


try {
  const response = await api.getBookings();

  // API returns { success: true, data: [...] }
  const rows = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  // Demo customer has ID 1; show only their bookings when customer_id exists.
  const customerBookings = rows.filter(
    (booking) => booking.customer_id == null || Number(booking.customer_id) === 1
  );

  setBookings(customerBookings);
} catch (err) {
  console.error('Failed to load bookings:', err);
  setError('Could not load bookings. Check that the backend is running on port 5000.');
} finally {
  setLoading(false);
}


};

useEffect(() => {
loadBookings();
}, []);

const stats = {
total: bookings.length,
upcoming: bookings.filter(
(b) => ['Pending', 'Assigned', 'In Progress'].includes(b.status)
).length,
completed: bookings.filter((b) => b.status === 'Completed').length,
pending: bookings.filter((b) => b.status === 'Pending').length
};

const formatDate = (value) => {
if (!value) return '—';


const date = String(value).split('T')[0];
const parts = date.split('-');

if (parts.length !== 3) return date;
return `${parts[2]}/${parts[1]}/${parts[0]}`;


};

const getWorkerName = (booking) =>
booking.worker_name ||
booking.assigned_worker_name ||
booking.worker?.user_name ||
booking.worker?.name ||
'Unassigned';

if (loading) {
return ( <div className="p-8 text-center text-slate-500">
Loading dashboard... </div>
);
}

return ( <div className="space-y-6"> <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"> <div> <h1 className="text-2xl font-bold text-slate-900">
Welcome back, Rahul! </h1> <p className="text-slate-500">
Here's an overview of your service bookings. </p> </div>


    <div className="flex gap-3">
      <button onClick={loadBookings} className="btn-secondary">
        <RefreshCw className="w-4 h-4" /> Refresh
      </button>

      <Link to="/customer/bookings/new" className="btn-primary">
        <Plus className="w-5 h-5" /> Book a Service
      </Link>
    </div>
  </div>

  {error && (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      {error}
      <button onClick={loadBookings} className="ml-3 underline">
        Try again
      </button>
    </div>
  )}

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard title="Total Bookings" value={stats.total} icon={Calendar} />
    <StatCard title="Upcoming" value={stats.upcoming} icon={Clock} />
    <StatCard title="Completed" value={stats.completed} icon={CheckCircle} />
    <StatCard title="Pending" value={stats.pending} icon={AlertCircle} />
  </div>

  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-slate-900">
        Recent Bookings
      </h3>

      <Link
        to="/customer/bookings"
        className="text-sm text-primary font-medium hover:underline"
      >
        View All
      </Link>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3">Booking ID</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Worker</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                No bookings yet. Click "Book a Service" to create your first booking.
              </td>
            </tr>
          ) : (
            [...bookings]
              .sort((a, b) => Number(b.id) - Number(a.id))
              .map((booking) => (
                <tr key={booking.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    #{booking.id}
                  </td>

                  <td className="px-4 py-3">
                    {booking.service_type || booking.service || booking.category || 'Service'}
                    {booking.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {booking.description}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div>{formatDate(booking.start_time || booking.date)}</div>
                    {booking.start_time && (
                      <div className="text-xs text-slate-500">
                        {String(booking.start_time).split('T')[1]?.slice(0, 5) || ''}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {getWorkerName(booking)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status || 'Pending'} />
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      to={`/customer/bookings/${booking.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>


);
}
