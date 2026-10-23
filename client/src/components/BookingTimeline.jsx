import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

export default function BookingTimeline({ events }) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Booking Lifecycle</h3>
      <div className="relative">
        {events.map((event, idx) => (
          <div key={idx} className="flex gap-4 mb-6 last:mb-0 relative">
            {idx !== events.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-slate-200"></div>
            )}
            <div className="flex-shrink-0 mt-1">
              {event.completed ? (
                <CheckCircle className="w-8 h-8 text-primary bg-primary/10 rounded-full p-1.5" />
              ) : (
                <Circle className="w-8 h-8 text-slate-300 bg-slate-100 rounded-full p-1.5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-900">{event.status}</h4>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {event.time}
                </span>
              </div>
              <p className="text-sm text-slate-600">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}