const db = require('../db');

function normalizeSkill(skill) {
  if (!skill) return '';
  const s = String(skill).trim().toLowerCase();
  if (s.includes('elect') || s.includes('wire') || s.includes('switch') || s.includes('light') || s.includes('fan')) return 'electrical';
  if (s.includes('plumb') || s.includes('pipe') || s.includes('tap') || s.includes('leak') || s.includes('drain')) return 'plumbing';
  if (s.includes('clean') || s.includes('maid') || s.includes('wash') || s.includes('sanit')) return 'cleaning';
  if (s.includes('repair') || s.includes('fix') || s.includes('handyman') || s.includes('maintenance')) return 'repair';
  if (s.includes('carpent') || s.includes('wood') || s.includes('furniture')) return 'carpentry';
  if (s.includes('appliance') || s.includes('ac') || s.includes('refriger') || s.includes('geyser')) return 'appliance';
  if (s.includes('paint')) return 'painting';
  return s;
}

function checkAreaMatch(workerArea, bookingAddress) {
  if (!workerArea || !bookingAddress) return true;
  const w = String(workerArea).trim().toLowerCase();
  const b = String(bookingAddress).trim().toLowerCase();
  if (b.includes(w) || w.includes(b)) return true;
  const wTokens = w.split(/[\s,]+/).filter(t => t.length > 2);
  return wTokens.some(tok => b.includes(tok));
}

function allocateWorker(bookingId, excludeWorkerId = null) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }

  const bookingServiceNorm = normalizeSkill(booking.service_type);

  const allWorkers = db.prepare(`
    SELECT w.id, w.user_id, w.skills, w.service_area, w.verified, w.available, u.name AS user_name
    FROM workers w
    JOIN users u ON w.user_id = u.id
    WHERE w.verified = 1
      AND w.available = 1
      AND (? IS NULL OR w.id != ?)
  `).all(excludeWorkerId, excludeWorkerId);

  const candidateWorkers = allWorkers.filter(w => {
    const skillsList = String(w.skills || '').split(',').map(s => s.trim());
    const hasSkill = skillsList.some(s => {
      const sNorm = normalizeSkill(s);
      return sNorm === bookingServiceNorm || s.toLowerCase().includes(booking.service_type.toLowerCase());
    });
    const servesArea = checkAreaMatch(w.service_area, booking.service_address);
    return hasSkill && servesArea;
  });

  if (candidateWorkers.length === 0) {
    return {
      success: false,
      message: `No available verified worker found with skill '${booking.service_type}' in service area.`
    };
  }

  const eligible = [];
  for (const worker of candidateWorkers) {
    const overlap = db.prepare(`
      SELECT COUNT(*) AS cnt
      FROM bookings
      WHERE assigned_worker_id = ?
        AND status IN ('Assigned', 'In Progress')
        AND id != ?
        AND start_time < ?
        AND end_time > ?
    `).get(worker.id, bookingId, booking.end_time, booking.start_time);

    if (overlap.cnt === 0) {
      const workload = db.prepare(`
        SELECT COUNT(*) AS cnt
        FROM bookings
        WHERE assigned_worker_id = ?
          AND status IN ('Pending', 'Assigned', 'In Progress')
          AND id != ?
      `).get(worker.id, bookingId);

      eligible.push({ ...worker, workload: workload.cnt });
    }
  }

  if (eligible.length === 0) {
    return {
      success: false,
      isConflict: true,
      message: `Scheduling conflict: All qualified workers have overlapping bookings during ${booking.start_time} - ${booking.end_time}.`
    };
  }

  eligible.sort((a, b) => a.workload - b.workload || a.id - b.id);
  const selected = eligible[0];

  db.prepare(`
    UPDATE bookings
    SET assigned_worker_id = ?,
        status = 'Assigned',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(selected.id, bookingId);

  const reason = `Fair Workload Allocation: Selected worker ${selected.user_name} (ID ${selected.id}) - verified, available, skill matched (${booking.service_type}), no overlapping schedule, lowest active workload (${selected.workload}) among ${eligible.length} eligible candidate(s).`;

  db.prepare(`
    INSERT INTO allocation_history (booking_id, worker_id, action, reason)
    VALUES (?, ?, 'ASSIGNED', ?)
  `).run(bookingId, selected.id, reason);

  db.prepare(`
    INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
    VALUES (?, 'WORKER_ALLOCATED', 'booking', ?, ?)
  `).run(
    booking.customer_id,
    bookingId,
    JSON.stringify({
      worker_id: selected.id,
      worker_name: selected.user_name,
      workload: selected.workload,
      candidates_count: eligible.length,
      reason,
    })
  );

  return { success: true, worker: selected, reason };
}

module.exports = {
  allocateWorker,
  normalizeSkill,
  checkAreaMatch
};