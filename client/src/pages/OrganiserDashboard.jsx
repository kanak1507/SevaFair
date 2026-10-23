import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

const chartData = [
  { name: 'Amit K.', jobs: 2 },
  { name: 'Vikram D.', jobs: 3 },
  { name: 'Rohan M.', jobs: 0 },
  { name: 'Sneha P.', jobs: 1 },
];

export default function OrganiserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    api.getBookings().then(setBookings);
    api.getWorkers().then(setWorkers);
  }, []);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    confirmed: bookings.filter(b => b.status === 'In Progress').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    verifiedWorkers: workers.filter(w => w.verified).length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Organiser Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Bookings" value={stats.total} icon={Calendar} />
        <StatCard title="Pending" value={stats.pending} icon={AlertTriangle} />
        <StatCard title="In Progress" value={stats.confirmed} icon={BarChart3} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} />
        <StatCard title="Verified Workers" value={stats.verifiedWorkers} icon={Users} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Workload Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Worker Workload Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="jobs" fill="#166534" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {bookings.slice(0, 4).map((b, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{b.service} booking {b.status.toLowerCase()}</p>
                  <p className="text-xs text-slate-500">ID: {b.id} • {b.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Management Tables */}
      <div className="card">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Pending Bookings Requiring Attention</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.filter(b => b.status === 'Pending').map(b => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{b.id}</td>
                  <td className="px-4 py-3">{b.customer}</td>
                  <td className="px-4 py-3">{b.service}</td>
                  <td className="px-4 py-3">{b.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <button className="text-primary font-medium hover:underline text-xs">Assign Worker</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}