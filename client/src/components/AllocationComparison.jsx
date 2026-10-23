import React from 'react';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

export default function AllocationComparison({ data }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">ILLUSTRATIVE DEMO DATA</span>
        <h3 className="text-lg font-bold text-slate-900">Fair Allocation Comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Skill Matched</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Overlapping Job</th>
              <th className="px-4 py-3">Active Jobs</th>
              <th className="px-4 py-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {data.comparison.map((worker, idx) => (
              <tr key={idx} className={`border-b ${worker.selected ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                <td className="px-4 py-3 font-medium">{worker.name}</td>
                <td className="px-4 py-3">{worker.verified === 'Yes' ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-red-600"/>}</td>
                <td className="px-4 py-3">{worker.skillMatched === 'Yes' ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-red-600"/>}</td>
                <td className="px-4 py-3">{worker.available === 'Yes' ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-red-600"/>}</td>
                <td className="px-4 py-3">{worker.overlapping === 'Yes' ? <XCircle className="w-4 h-4 text-red-600"/> : <CheckCircle className="w-4 h-4 text-green-600"/>}</td>
                <td className="px-4 py-3">{worker.activeJobs}</td>
                <td className="px-4 py-3">
                  {worker.selected ? (
                    <span className="text-green-700 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Selected</span>
                  ) : (
                    <span className="text-slate-600">{worker.result}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-primary-dark font-medium flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {data.explanation}
        </p>
      </div>
    </div>
  );
}