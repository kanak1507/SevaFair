import React, { useState, useEffect } from 'react';
import { ShieldCheck, ListChecks } from 'lucide-react';
import AllocationComparison from "../components/AllocationComparison.jsx";
import BookingTimeline from "../components/BookingTimeline.jsx";
import api from '../services/api';
import { allocationDemoData, timelineDemoData } from '../data/demoData';

export default function AllocationDetails() {
  const [allocation, setAllocation] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAllocationDetails('B003'),
      api.getTimeline('B003')
    ]).then(([alloc, time]) => {
      setAllocation(alloc);
      setTimeline(time);
    }).catch(() => {
      setAllocation(allocationDemoData);
      setTimeline(timelineDemoData);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading allocation details...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fair Allocation Details</h1>
          <p className="text-slate-500">Booking ID: {allocation.bookingId} • Service: {allocation.service}</p>
        </div>
      </div>

      {/* Allocation Process Steps */}
      <div className="card">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" /> Allocation Process
        </h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {allocation.steps.map((step, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              {step.replace(/^\d+\.\s*/, '')}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <AllocationComparison data={allocation} />

      {/* Timeline */}
      <BookingTimeline events={timeline} />
    </div>
  );
}