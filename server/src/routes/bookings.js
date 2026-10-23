const express = require('express');
const db = require('../db');

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper: Fair worker allocation
// ---------------------------------------------------------------------------
// Finds the best eligible worker for a booking based on:
//   1. Verified & available
//   2. Skills match service_type (case-insensitive)
//   3. Service area matches booking address (case-insensitive)
//   4. No overlapping bookings in 'Assigned' or 'In Progress'
//   5. Lowest active workload wins; tie-break by lowest worker ID
//
// Must be called inside a transaction.
// ---------------------------------------------------------------------------
function allocateWorker(bookingId, excludeWorkerId = null) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }

  // 1. Find candidates matching skill + area + verified + available
  const candidates = db.prepare(`
    SELECT w.id, w.user_id, w.skills, w.service_area, u.name AS user_name
    FROM workers w
    JOIN users u ON w.user_id = u.id
    WHERE w.verified = 1
      AND w.available = 1
      AND (? IS NULL OR w.id != ?)
      AND LOWER(w.skills) LIKE ?
      AND LOWER(w.service_area) LIKE ?
  `).all(
    excludeWorkerId,
    excludeWorkerId,
    `%${booking.service_type.toLowerCase()}%`,
    `%${booking.service_address.toLowerCase()}%`
  );

  // 2. Filter out workers with overlapping accepted bookings
  const eligible = [];
  for (const worker of candidates) {
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
      // 3. Compute active workload (Pending + Assigned + In Progress)
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
    return { success: false, message: 'No eligible worker found' };
  }

  // 4. Pick lowest workload, tie-break by lowest ID
  eligible.sort((a, b) => a.workload - b.workload || a.id - b.id);
  const selected = eligible[0];

  // 5. Update the booking
  db.prepare(`
    UPDATE bookings
    SET assigned_worker_id = ?,
        status = 'Assigned',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(selected.id, bookingId);

  const reason =
    `Selected worker ${selected.user_name} (ID ${selected.id}) - verified, available, ` +
    `skill matched, no overlapping bookings, lowest active workload (${selected.workload}) ` +
    `among ${eligible.length} eligible worker(s).`;

  // 6. Allocation history
  db.prepare(`
    INSERT INTO allocation_history (booking_id, worker_id, action, reason)
    VALUES (?, ?, 'ASSIGNED', ?)
  `).run(bookingId, selected.id, reason);

  // 7. Audit log
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

// ---------------------------------------------------------------------------
// GET /api/bookings
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        b.id, b.customer_id, b.service_type, b.service_address,
        b.start_time, b.end_time, b.status, b.assigned_worker_id,
        b.created_at, b.updated_at,
        u.name AS customer_name,
        w.id AS worker_id,
        wu.name AS worker_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN workers w ON b.assigned_worker_id = w.id
      LEFT JOIN users wu ON w.user_id = wu.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE b.status = ?';
      params.push(status);
    }
    query += ' ORDER BY b.created_at DESC';

    const bookings = db.prepare(query).all(...params);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bookings/:id
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = db.prepare(`
      SELECT
        b.id, b.customer_id, b.service_type, b.service_address,
        b.start_time, b.end_time, b.status, b.assigned_worker_id,
        b.created_at, b.updated_at,
        u.name AS customer_name,
        w.id AS worker_id,
        wu.name AS worker_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN workers w ON b.assigned_worker_id = w.id
      LEFT JOIN users wu ON w.user_id = wu.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/bookings  (creates booking + auto-allocates a fair worker)
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  try {
    const { customer_id, service_type, service_address, start_time, end_time } = req.body;

    if (!customer_id || !service_type || !service_address || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer_id, service_type, service_address, start_time, end_time',
      });
    }

    const customerId = parseInt(customer_id, 10);
    if (isNaN(customerId) || customerId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid customer_id' });
    }

    const customer = db.prepare('SELECT id, role FROM users WHERE id = ?').get(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (customer.role !== 'customer') {
      return res.status(400).json({ success: false, message: 'User is not a customer' });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ success: false, message: 'End time must be later than start time' });
    }
    if (typeof service_type !== 'string' || service_type.trim() === '') {
      return res.status(400).json({ success: false, message: 'service_type must be a non-empty string' });
    }
    if (typeof service_address !== 'string' || service_address.trim() === '') {
      return res.status(400).json({ success: false, message: 'service_address must be a non-empty string' });
    }

    const cleanServiceType = service_type.trim();
    const cleanAddress = service_address.trim();

    const txn = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO bookings
          (customer_id, service_type, service_address, start_time, end_time, status, assigned_worker_id)
        VALUES (?, ?, ?, ?, ?, 'Pending', NULL)
      `).run(customerId, cleanServiceType, cleanAddress, start_time, end_time);

      const bookingId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
        VALUES (?, 'BOOKING_CREATED', 'booking', ?, ?)
      `).run(
        customerId,
        bookingId,
        JSON.stringify({
          service_type: cleanServiceType,
          service_address: cleanAddress,
          start_time,
          end_time,
        })
      );

      // Attempt fair allocation
      const alloc = allocateWorker(bookingId);
      return { bookingId, allocation: alloc };
    });

    const { bookingId, allocation } = txn();

    res.status(201).json({
      success: true,
      message: allocation.success
        ? 'Booking created and worker allocated successfully'
        : 'Booking created; no eligible worker found — remains pending',
      data: {
        id: bookingId,
        allocated: allocation.success,
        worker: allocation.worker || null,
        reason: allocation.reason || allocation.message,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/bookings/:id/cancel
// ---------------------------------------------------------------------------
router.patch('/:id/cancel', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = db.prepare('SELECT id, status, customer_id, assigned_worker_id FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel booking with status '${booking.status}'`,
      });
    }

    const txn = db.transaction(() => {
      db.prepare(`
        UPDATE bookings
        SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bookingId);

      db.prepare(`
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
        VALUES (?, 'BOOKING_CANCELLED', 'booking', ?, ?)
      `).run(
        booking.customer_id,
        bookingId,
        JSON.stringify({ previous_status: booking.status, new_status: 'Cancelled' })
      );

      db.prepare(`
        INSERT INTO allocation_history (booking_id, worker_id, action, reason)
        VALUES (?, ?, 'CANCELLED', ?)
      `).run(
        bookingId,
        booking.assigned_worker_id,
        `Booking cancelled from status: ${booking.status}`
      );
    });

    txn();
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/bookings/:id/reassign
// Body (optional): { "reason": "..." }
// ---------------------------------------------------------------------------
router.patch('/:id/reassign', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = db.prepare('SELECT id, status, customer_id, assigned_worker_id FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(409).json({
        success: false,
        message: `Cannot reassign booking with status '${booking.status}'`,
      });
    }

    const userReason = (req.body && typeof req.body.reason === 'string') ? req.body.reason.trim() : null;

    const txn = db.transaction(() => {
      const previousWorkerId = booking.assigned_worker_id;

      // Record unassignment of previous worker (if any)
      if (previousWorkerId) {
        const prevWorker = db.prepare(`
          SELECT w.id, u.name AS user_name
          FROM workers w JOIN users u ON w.user_id = u.id
          WHERE w.id = ?
        `).get(previousWorkerId);

        db.prepare(`
          INSERT INTO allocation_history (booking_id, worker_id, action, reason)
          VALUES (?, ?, 'UNASSIGNED', ?)
        `).run(
          bookingId,
          previousWorkerId,
          userReason
            ? `Reassignment requested: ${userReason}`
            : 'Reassignment requested by organiser/system'
        );

        db.prepare(`
          INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
          VALUES (?, 'WORKER_UNASSIGNED', 'booking', ?, ?)
        `).run(
          booking.customer_id,
          bookingId,
          JSON.stringify({
            previous_worker_id: previousWorkerId,
            previous_worker_name: prevWorker ? prevWorker.user_name : null,
            reason: userReason || 'Reassignment requested',
          })
        );
      }

      // Clear current assignment so the new allocation is clean
      db.prepare(`
        UPDATE bookings
        SET assigned_worker_id = NULL,
            status = 'Pending',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bookingId);

      // Allocate a different eligible worker
      const alloc = allocateWorker(bookingId, previousWorkerId);

      if (!alloc.success) {
        // Roll back by re-marking as pending (already is) and record failure
        db.prepare(`
          INSERT INTO allocation_history (booking_id, worker_id, action, reason)
          VALUES (?, NULL, 'REALLOCATION_FAILED', ?)
        `).run(bookingId, alloc.message || 'No eligible replacement worker found');

        return { reallocated: false, message: alloc.message };
      }

      return { reallocated: true, worker: alloc.worker, reason: alloc.reason };
    });
// Find verified and available workers matching service and location.
// Match the worker's service area against the booking address, not the
// entire booking address against the worker's service area.
const bookingService = String(booking.service_type || '').trim().toLowerCase();
const bookingAddress = String(booking.service_address || '').trim().toLowerCase();

const candidates = db.prepare(`     SELECT w.id, w.user_id, w.skills, w.service_area, u.name AS user_name
    FROM workers w
    JOIN users u ON w.user_id = u.id
    WHERE w.verified = 1
      AND w.available = 1
      AND (? IS NULL OR w.id != ?)
  `).all(excludeWorkerId, excludeWorkerId).filter((worker) => {
const skills = String(worker.skills || '')
.split(',')
.map((skill) => skill.trim().toLowerCase());

const area = String(worker.service_area || '').trim().toLowerCase();

const serviceMatches = skills.some((skill) =>
  skill === bookingService ||
  skill.includes(bookingService) ||
  bookingService.includes(skill)
);

// Match if either location contains the other.
// Example: "Bengaluru" matches "MG Road, Bengaluru".
const areaMatches =
  area.length > 0 &&
  bookingAddress.length > 0 &&
  (bookingAddress.includes(area) || area.includes(bookingAddress));

return serviceMatches && areaMatches;


});

    const result = txn();

    if (!result.reallocated) {
      return res.status(409).json({
        success: false,
        message: result.message || 'Reassignment failed: no eligible replacement worker',
      });
    }

    res.json({
      success: true,
      message: 'Booking reassigned successfully',
      data: {
        worker: result.worker,
        reason: result.reason,
      },
    });
  } catch (error) {
    console.error('Error reassigning booking:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/bookings/:id/history
// ---------------------------------------------------------------------------
router.get('/:id/history', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const history = db.prepare(`
      SELECT
        ah.id, ah.booking_id, ah.worker_id, ah.action, ah.reason, ah.created_at,
        u.name AS worker_name
      FROM allocation_history ah
      LEFT JOIN workers w ON ah.worker_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE ah.booking_id = ?
      ORDER BY ah.created_at ASC
    `).all(bookingId);

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching booking history:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;