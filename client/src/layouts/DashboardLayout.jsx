import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, Users, Settings, Briefcase, LogOut, BarChart3, ShieldCheck } from 'lucide-react';

const navItems = [
  { to: '/customer', label: 'Customer Dashboard', icon: Home, role: 'customer' },
  { to: '/customer/bookings', label: 'My Bookings', icon: Calendar, role: 'customer' },
  { to: '/worker', label: 'Worker Dashboard', icon: Briefcase, role: 'worker' },
  { to: '/worker/jobs', label: 'My Jobs', icon: Calendar, role: 'worker' },
  { to: '/organiser', label: 'Organiser Dashboard', icon: BarChart3, role: 'organiser' },
  { to: '/organiser/workers', label: 'Manage Workers', icon: Users, role: 'organiser' },
  { to: '/organiser/bookings', label: 'Manage Bookings', icon: Calendar, role: 'organiser' },
  { to: '/allocation', label: 'Allocation Details', icon: ShieldCheck, role: 'all' },
];

export default function DashboardLayout({ role = 'customer' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const filteredNav = navItems.filter(item => item.role === 'all' || item.role === role);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> SEVA FAIR
          </span>
        </div>
        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button className="lg:hidden p-2 text-slate-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {role[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}