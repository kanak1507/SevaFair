export const demoBookings = [
  { id: 'B001', customer: 'Rahul Sharma', service: 'Plumbing', status: 'Completed', date: '2026-10-20', worker: 'Amit Kumar' },
  { id: 'B002', customer: 'Priya Singh', service: 'Electrical', status: 'In Progress', date: '2026-10-23', worker: 'Vikram Das' },
  { id: 'B003', customer: 'Anita Desai', service: 'Cleaning', status: 'Pending', date: '2026-10-25', worker: null },
];

export const demoWorkers = [
  { id: 'W001', name: 'Amit Kumar', skills: ['Plumbing', 'Pipe Fitting'], verified: true, activeJobs: 1, completedJobs: 45, availability: 'Available' },
  { id: 'W002', name: 'Vikram Das', skills: ['Electrical', 'Wiring'], verified: true, activeJobs: 2, completedJobs: 32, availability: 'Busy' },
  { id: 'W003', name: 'Rohan Mehta', skills: ['Cleaning', 'Deep Clean'], verified: false, activeJobs: 0, completedJobs: 5, availability: 'Available' },
];

export const allocationDemoData = {
  bookingId: 'B003',
  service: 'Cleaning',
  steps: [
    '1. Verify worker credentials',
    '2. Check required skills match',
    '3. Check worker availability',
    '4. Exclude overlapping accepted jobs',
    '5. Compare active workloads',
    '6. Select eligible worker with lowest workload',
    '7. Display allocation explanation'
  ],
  comparison: [
    { name: 'Worker A (Rohan Mehta)', verified: 'Yes', skillMatched: 'Yes', available: 'Yes', overlapping: 'Yes', activeJobs: 2, result: 'Excluded due to conflict', selected: false },
    { name: 'Worker B (Sneha Patel)', verified: 'Yes', skillMatched: 'Yes', available: 'Yes', overlapping: 'No', activeJobs: 1, result: 'Selected', selected: true },
    { name: 'Worker C (Amit Kumar)', verified: 'Yes', skillMatched: 'Yes', available: 'Yes', overlapping: 'No', activeJobs: 3, result: 'Eligible, but higher workload', selected: false },
  ],
  explanation: "Worker B was selected because they meet all eligibility requirements, have no overlapping accepted booking, and have the lowest active-job count among eligible workers."
};

export const timelineDemoData = [
  { status: 'Booking Created', time: '2026-10-23 09:00 AM', description: 'Customer submitted a cleaning service request.', completed: true },
  { status: 'Eligibility Checked', time: '2026-10-23 09:05 AM', description: 'System verified worker skills and availability.', completed: true },
  { status: 'Worker Assigned', time: '2026-10-23 09:10 AM', description: 'Worker B (Sneha Patel) assigned via fair allocation.', completed: true },
  { status: 'Job In Progress', time: '2026-10-25 10:00 AM', description: 'Worker marked the job as started.', completed: false },
  { status: 'Job Completed', time: 'Pending', description: 'Awaiting worker completion and customer confirmation.', completed: false },
];