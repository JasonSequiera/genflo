// ══════════════════════════════════════════════════
// GenFlo — Express Server Entry Point
// ══════════════════════════════════════════════════
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────
app.use(cors({
  origin: [
    // Local development
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
    // GitHub Pages — replace with your actual GitHub username
    'https://jasonsequiera.github.io',
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (shows every request in terminal) ──
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/cycle',   require('./routes/cycle'));
app.use('/api/logs',    require('./routes/logs'));
app.use('/api/partner', require('./routes/partner'));
app.use('/api/aria',    require('./routes/aria'));
app.use('/api/dates',   require('./routes/dates'));

// ── Health Check ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GenFlo API is running 🌿',
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ──────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n🌿 ════════════════════════════════════════');
  console.log('   GenFlo API is running!');
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Health: http://localhost:${PORT}/api/health`);
  console.log('🌿 ════════════════════════════════════════\n');
});
