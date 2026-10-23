const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Resolve absolute path to the database file relative to this file's location
const dbDir = path.join(__dirname, '..', 'database');
const dbPath = path.join(dbDir, 'seva_fair.db');

// Create database directory automatically if it does not exist
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create database directory:', error.message);
  throw error;
}

let db;

try {
  // Initialize SQLite database
  db = new Database(dbPath);

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'worker', 'organiser')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      skills TEXT,
      service_area TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_type TEXT NOT NULL,
      service_address TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled')),
      assigned_worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS allocation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance optimization
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_assigned_worker ON bookings(assigned_worker_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_allocation_history_booking ON allocation_history(booking_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
  `);

  console.log('Database initialized successfully at:', dbPath);
} catch (error) {
  console.error('Failed to initialize database schema:', error.message);
  throw error;
}

module.exports = db;