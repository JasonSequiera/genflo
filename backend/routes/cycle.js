// ══════════════════════════════════════════════════
// GenFlo — Cycle Routes
// POST /api/cycle/setup   — save cycle info
// GET  /api/cycle/current — get today's phase/day/forecasts
// GET  /api/cycle/calendar — monthly calendar data
// ══════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// ── Helper: Calculate current phase and day ───────
function calculateCycleData(periodStart, cycleLength = 28) {
  const today = new Date();
  const start = new Date(periodStart);
  const diffMs = today - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dayInCycle = (diffDays % cycleLength) + 1;

  let phase, phaseEmoji;
  if (dayInCycle <= 5)        { phase = 'Menstrual';   phaseEmoji = '🌑'; }
  else if (dayInCycle <= 13)  { phase = 'Follicular';  phaseEmoji = '🌒'; }
  else if (dayInCycle <= 16)  { phase = 'Ovulatory';   phaseEmoji = '🌕'; }
  else                        { phase = 'Luteal';       phaseEmoji = '🌘'; }

  const daysUntilNextPeriod = cycleLength - dayInCycle + 1;
  const pmsWindowStart = cycleLength - 7; // days 21-28
  const daysUntilPMS = pmsWindowStart - dayInCycle + 1;
  const inPMSWindow = dayInCycle >= pmsWindowStart;

  // Next phase
  let nextPhase, daysUntilNextPhase;
  if (phase === 'Menstrual')   { nextPhase = 'Follicular'; daysUntilNextPhase = 6 - dayInCycle; }
  else if (phase === 'Follicular') { nextPhase = 'Ovulatory'; daysUntilNextPhase = 14 - dayInCycle; }
  else if (phase === 'Ovulatory')  { nextPhase = 'Luteal'; daysUntilNextPhase = 17 - dayInCycle; }
  else { nextPhase = 'Menstrual'; daysUntilNextPhase = cycleLength - dayInCycle + 1; }

  return {
    dayInCycle,
    phase,
    phaseEmoji,
    cycleLength,
    daysUntilNextPeriod,
    daysUntilPMS: inPMSWindow ? 0 : daysUntilPMS,
    inPMSWindow,
    nextPhase,
    daysUntilNextPhase: Math.max(0, daysUntilNextPhase)
  };
}

// ── Setup / Update cycle ──────────────────────────
router.post('/setup', authMiddleware, async (req, res) => {
  const { period_start, cycle_length, period_length, conditions } = req.body;

  // Upsert cycle data (update if exists, insert if not)
  const { data, error } = await supabase
    .from('cycles')
    .upsert({
      user_id: req.user.id,
      period_start,
      cycle_length: cycle_length || 28,
      period_length: period_length || 5,
      conditions: conditions || []
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const cycleInfo = calculateCycleData(period_start, cycle_length);
  res.json({ ...data, ...cycleInfo });
});

// ── Get current cycle state ───────────────────────
router.get('/current', authMiddleware, async (req, res) => {
  const { data: cycle, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (error || !cycle) {
    return res.status(404).json({ error: 'No cycle data found. Please complete onboarding.' });
  }

  const cycleInfo = calculateCycleData(cycle.period_start, cycle.cycle_length);
  res.json({ ...cycle, ...cycleInfo });
});

// ── Monthly calendar data ─────────────────────────
router.get('/calendar', authMiddleware, async (req, res) => {
  const { month, year } = req.query;
  const { data: cycle, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (error || !cycle) {
    return res.status(404).json({ error: 'No cycle data found' });
  }

  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  const calendar = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(targetYear, targetMonth - 1, day);
    const start = new Date(cycle.period_start);
    const diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24));
    const dayInCycle = ((diffDays % cycle.cycle_length) + cycle.cycle_length) % cycle.cycle_length + 1;

    let phase;
    if (dayInCycle <= 5)        phase = 'menstrual';
    else if (dayInCycle <= 13)  phase = 'follicular';
    else if (dayInCycle <= 16)  phase = 'ovulatory';
    else                        phase = 'luteal';

    const isPMSWindow = dayInCycle >= (cycle.cycle_length - 7);
    const isToday = date.toDateString() === new Date().toDateString();

    calendar.push({ day, phase, dayInCycle, isPMSWindow, isToday });
  }

  res.json({ calendar, cycle });
});

module.exports = router;
