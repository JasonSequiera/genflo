// ══════════════════════════════════════════════════
// GenFlo — Daily Logs Routes
// POST /api/logs/daily  — save today's log
// GET  /api/logs/today  — get today's log
// GET  /api/logs/history — get past logs
// ══════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// ── Save daily log ────────────────────────────────
router.post('/daily', authMiddleware, async (req, res) => {
  const { mood, energy, oiliness, hydration, sensitivity, breakouts, symptoms, notes } = req.body;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Upsert — update today's entry if it already exists
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert({
      user_id: req.user.id,
      log_date: today,
      mood,
      energy,
      oiliness,
      hydration,
      sensitivity,
      breakouts,
      symptoms: symptoms || [],
      notes
    }, { onConflict: 'user_id,log_date' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Log saved!', data });
});

// ── Get today's log ───────────────────────────────
router.get('/today', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('log_date', today)
    .single();

  if (error) return res.json({ log: null }); // No log today yet
  res.json({ log: data });
});

// ── Get log history ───────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('log_date', { ascending: false })
    .limit(days);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Save supplement log ───────────────────────────
router.post('/supplements', authMiddleware, async (req, res) => {
  const { supplement, time_of_day, taken } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('supplement_logs')
    .upsert({
      user_id: req.user.id,
      log_date: today,
      supplement,
      time_of_day,
      taken
    }, { onConflict: 'user_id,log_date,supplement' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Supplement logged!', data });
});

// ── Get today's supplements ───────────────────────
router.get('/supplements', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('supplement_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('log_date', today)
    .order('time_of_day');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
