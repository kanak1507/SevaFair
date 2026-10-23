const express = require('express');
const db = require('../db');

const router = express.Router();

// Helper: Validate a positive integer ID
function getValidId(id) {
  const parsedId = Number(id);

  if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

// GET /api/workers
// Retrieve workers with optional verified, available, and skill filters.
router.get('/', (req, res) => {
  try {
    const { verified, available, skill } = req.query;

    let query = `
      SELECT
        w.id,
        w.user_id,
        w.skills,
        w.service_area,
        w.verified,
        w.available,
        w.created_at,
        u.name AS user_name
      FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE 1 = 1
    `;

    const params = [];

    if (verified !== undefined) {
      if (verified !== 'true' && verified !== 'false') {
        return res.status(400).json({
          success: false,
          message: 'Invalid verified parameter. Use true or false.'
        });
      }

      query += ' AND w.verified = ?';
      params.push(verified === 'true' ? 1 : 0);
    }

    if (available !== undefined) {
      if (available !== 'true' && available !== 'false') {
        return res.status(400).json({
          success: false,
          message: 'Invalid available parameter. Use true or false.'
        });
      }

      query += ' AND w.available = ?';
      params.push(available === 'true' ? 1 : 0);
    }

    if (skill !== undefined) {
      if (typeof skill !== 'string' || !skill.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Skill must be a non-empty keyword.'
        });
      }

      // Escape SQL LIKE wildcards so the search is a literal substring.
      const escapedSkill = skill.trim().replace(/[\\%_]/g, '\\$&');

      query += ` AND LOWER(w.skills) LIKE LOWER(?) ESCAPE '\\'`;
      params.push(`%${escapedSkill}%`);
    }

    query += ' ORDER BY w.id ASC';

    const workers = db.prepare(query).all(...params);

    return res.json({
      success: true,
      data: workers
    });
  } catch (error) {
    console.error('Error fetching workers:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/workers/:id
// Retrieve one worker and their active job count.
router.get('/:id', (req, res) => {
  try {
    const workerId = getValidId(req.params.id);

    if (workerId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID.'
      });
    }

    const worker = db.prepare(`
      SELECT
        w.id,
        w.user_id,
        w.skills,
        w.service_area,
        w.verified,
        w.available,
        w.created_at,
        u.name AS user_name
      FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `).get(workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found.'
      });
    }

    const workload = db.prepare(`
      SELECT COUNT(*) AS active_jobs
      FROM bookings
      WHERE assigned_worker_id = ?
        AND status IN ('Pending', 'Assigned', 'In Progress')
    `).get(workerId);

    worker.active_jobs = workload.active_jobs;

    return res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error('Error fetching worker:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PATCH /api/workers/:id/availability
// Update worker availability and record the change atomically.
router.patch('/:id/availability', (req, res) => {
  try {
    const workerId = getValidId(req.params.id);

    if (workerId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID.'
      });
    }

    const { available } = req.body || {};

    if (typeof available !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: available must be true or false.'
      });
    }

    const worker = db.prepare(
      'SELECT id FROM workers WHERE id = ?'
    ).get(workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found.'
      });
    }

    const updateAvailability = db.transaction(() => {
      db.prepare(`
        UPDATE workers
        SET available = ?
        WHERE id = ?
      `).run(available ? 1 : 0, workerId);

      db.prepare(`
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          details
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        null,
        'WORKER_AVAILABILITY_UPDATED',
        'worker',
        workerId,
        JSON.stringify({ available })
      );
    });

    updateAvailability();

    return res.json({
      success: true,
      message: 'Availability updated successfully.',
      data: {
        worker_id: workerId,
        available
      }
    });
  } catch (error) {
    console.error('Error updating worker availability:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
