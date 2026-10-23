const express = require('express');
const db = require('../db');
const { allocateWorker } = require('../services/allocationService');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, customer_id, worker_id } = req.query;
    let query = `
      SELECT 
        b.id, b.customer_id, b.service_type, b.service_address,
        b.start_time, b.end_time, b.status, b.assigned_worker_id,
        b.created_at, b.updated_at,
        u.name AS customer_name,
        w_user.name AS assigned_worker_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN workers w ON b.assigned_worker_id = w.id
      LEFT JOIN users w_user ON w.user_id = w_user.id
      WHERE 1 = 1
    `;
    const params = [];
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (customer_id) { query += ' AND b.customer_id = ?'; params.push(customer_id); }
    if (worker_id) { query += ' AND b.assigned_worker_id = ?'; params.push(worker_id); }
    query += ' ORDER BY b.created_at DESC';

    const bookings = db.prepare(query).all(...params);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId) || bookingId <= 0) return res.status(400).json({ success: false, message: 'Invalid booking ID' });

    const booking = db.prepare(`
      SELECT 
        b.id, b.customer_id, b.service_type, b.service_address,
        b.start_time, b.end_time, b.status, b.assigned_worker_id,
        b.created_at, b.updated_at,
        u.name AS customer_name,
        w_user.name AS assigned_worker_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN workers w ON b.assigned_worker_id = w.id
      LEFT JOIN users w_user ON w.user_id = w_user.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', (req, res) => {
  try {
    const { customer_id, service_type, service_address, start_time, end_time } = req.body || {};
    if (!customer_id || !service_type || !service_address || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let createdBookingId;
    let allocResult;

    const txn = db.transaction(() => {
      const insertResult = db.prepare(`
        INSERT INTO bookings (customer_id, service_type, service_address, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, 'Pending')
      `).run(customer_id, service_type, service_address, start_time, end_time);

      createdBookingId = insertResult.lastInsertRowid;
      allocResult = allocateWorker(createdBookingId);
    });

    txn();

    const finalBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(createdBookingId);
    res.status(201).json({
      success: true,
      data: {
        booking: finalBooking,
        allocated: allocResult.success,
        worker: allocResult.worker || null,
        reason: allocResult.reason || allocResult.message
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/:id/cancel', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const booking = db.prepare('SELECT id, status, customer_id, assigned_worker_id FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    db.prepare("UPDATE bookings SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(bookingId);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/:id/reassign', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const booking = db.prepare('SELECT id, status, customer_id, assigned_worker_id FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    let result;
    const txn = db.transaction(() => {
      const prevWorkerId = booking.assigned_worker_id;
      db.prepare("UPDATE bookings SET assigned_worker_id = NULL, status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(bookingId);
      const alloc = allocateWorker(bookingId, prevWorkerId);
      if (!alloc.success) {
        return { reallocated: false, message: alloc.message };
      }
      return { reallocated: true, worker: alloc.worker, reason: alloc.reason };
    });

    result = txn();
    res.json({
      success: true,
      reallocated: result.reallocated,
      message: result.reallocated ? 'Booking reassigned successfully' : result.message,
      data: result.reallocated ? { worker: result.worker, reason: result.reason } : null
    });
  } catch (error) {
    console.error('Error reassigning booking:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
});

router.get('/:id/history', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const history = db.prepare(`
      SELECT ah.id, ah.booking_id, ah.worker_id, ah.action, ah.reason, ah.created_at, u.name AS worker_name
      FROM allocation_history ah
      LEFT JOIN workers w ON ah.worker_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE ah.booking_id = ?
      ORDER BY ah.created_at ASC
    `).all(bookingId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;