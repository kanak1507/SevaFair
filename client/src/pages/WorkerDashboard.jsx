import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Briefcase, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function WorkerDashboard() {
  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    api.getWorkers().then(data => {
      // Simulating logged-in worker as the first one for demo
      setWorker(data[0]); 
    });
    api.getBookings().then(data => setJobs(data.filter(b => b.worker === 'Amit Kumar' || b.worker === null)));
  }, []);

  if (!worker) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
          {worker.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">{worker.name}</h2>
            {worker.verified ? (
              <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" /> Unverified
              </span>
            )}
          </div>
          <p className="text-slate-600 mb-2">Skills: {worker.skills.join(', ')}</p>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-slate-600"><Briefcase className="w-4 h-4" /> {worker.activeJobs} Active Jobs</span>
            <span className="flex items-center gap-1 text-slate-600"><CheckCircle className="w-4 h-4" /> {worker.completedJobs} Completed</span>
            <StatusBadge status={worker.availability} />
          </div>
        </div>
      </div>

      {/* Workload Indicator */}
      <div className="card">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Current Workload</h3>
        <div className="w-full bg-slate-200 rounded-full h-4">
          <div className="bg-primary h-4 rounded-full transition-all duration-500" style={{ width: `${(worker.activeJobs / 5) * 100}%` }}></div>
        </div>
        <p className="text-sm text-slate-500 mt-2">{worker.activeJobs} out of 5 maximum concurrent jobs</p>
      </div>

      {/* Upcoming Jobs */}
      <div className="card">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Assigned Jobs</h3>
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No jobs assigned currently.</p>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900">{job.service} - {job.id}</h4>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {job.date} | Customer: {job.customer}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.status === 'Pending' && (
                    <button className="btn-secondary text-sm py-1.5">Report Unavailability</button>
                  )}
                  {job.status === 'In Progress' && (
                    <button className="btn-primary text-sm py-1.5">Complete Job</button>
                  )}
                  {job.status === 'Pending' && (
                    <button className="btn-primary text-sm py-1.5">Start Job</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}