require('dotenv').config();

const express = require('express');
const cors = require('cors');

const workersRouter = require('./routes/workers');
const bookingsRouter = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SEVA FAIR API is running'
  });
});

app.use('/api/workers', workersRouter);
app.use('/api/bookings', bookingsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SEVA FAIR Backend running at http://localhost:${PORT}`);
  });
}

module.exports = { app };
