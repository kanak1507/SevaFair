import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Wrench, Zap, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';


const services = [
  { icon: Wrench, title: 'Plumbing', desc: 'Leak fixes, pipe fitting, and installations.' },
  { icon: Zap, title: 'Electrical Repairs', desc: 'Wiring, fixture installation, and safety checks.' },
  { icon: Sparkles, title: 'Cleaning', desc: 'Deep cleaning, regular maintenance, and sanitization.' },
  { icon: Wrench, title: 'Appliance Repair', desc: 'Fixing refrigerators, washing machines, and more.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-slate-900">SEVA FAIR</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-slate-600 hover:text-primary font-medium">Services</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-primary font-medium">How it Works</a>
            <Link to="/login" className="text-slate-600 hover:text-primary font-medium">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Fair Bookings. <span className="text-primary">Trusted Workers.</span> Transparent Service.
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          SEVA FAIR ensures equitable job allocation, verified professionals, and complete transparency for every local service booking.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/customer" className="btn-primary text-lg px-8 py-3">Book a Service</Link>
          <Link to="#services" className="btn-secondary text-lg px-8 py-3">Explore Services</Link>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Our Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow cursor-pointer group">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <s.icon className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Highlights */}
      <section id="how-it-works" className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Why Choose SEVA FAIR?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Verified Workers', desc: 'Every professional undergoes strict background and skill verification.' },
            { title: 'Conflict-Free Scheduling', desc: 'Smart allocation prevents overlapping jobs and burnout.' },
            { title: 'Transparent Allocation', desc: 'See exactly how and why a worker was assigned to your job.' }
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-white">SEVA FAIR</span>
            </div>
            <p className="text-sm max-w-xs">Empowering local service workers with fair, transparent, and efficient job allocation.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Services</a></li>
              <li><a href="#" className="hover:text-white">For Workers</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          © 2026 SEVA FAIR. Team Infinite Igniters. Tech Fusion 2026.
        </div>
      </footer>
    </div>
  );
}