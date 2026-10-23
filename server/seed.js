const db = require('./src/db');

const seed = db.transaction(() => {
const insertUser = db.prepare(`     INSERT OR IGNORE INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

insertUser.run('Demo Customer', '[customer@sevafair.demo](mailto:customer@sevafair.demo)', 'demo-hash', 'customer');
insertUser.run('Ravi Kumar', '[ravi@sevafair.demo](mailto:ravi@sevafair.demo)', 'demo-hash', 'worker');
insertUser.run('Priya Sharma', '[priya@sevafair.demo](mailto:priya@sevafair.demo)', 'demo-hash', 'worker');

const getUser = db.prepare('SELECT id FROM users WHERE email = ?');
const ravi = getUser.get('[ravi@sevafair.demo](mailto:ravi@sevafair.demo)');
const priya = getUser.get('[priya@sevafair.demo](mailto:priya@sevafair.demo)');

const insertWorker = db.prepare(`     INSERT OR IGNORE INTO workers
      (user_id, skills, service_area, verified, available)
    VALUES (?, ?, ?, 1, 1)
  `);

insertWorker.run(ravi.id, 'Plumbing, Electrical, Repair', 'Bengaluru');
insertWorker.run(priya.id, 'Cleaning, Plumbing, Home Repair', 'Bengaluru');
});

seed();

console.log('Demo users and workers created successfully.');
console.log('Customer ID:', db.prepare("SELECT id FROM users WHERE email = '[customer@sevafair.demo](mailto:customer@sevafair.demo)'").get().id);
console.log('Workers:', db.prepare('SELECT id, skills, service_area, verified, available FROM workers').all());

db.close();
