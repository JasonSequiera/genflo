// ══════════════════════════════════════════════════
// GenFlo — Partner Routes
// POST /api/partner/connect     — connect a partner
// GET  /api/partner/info        — get partner info
// POST /api/partner/nudge       — send a nudge
// GET  /api/partner/nudges      — get nudge history
// POST /api/partner/schedule    — save manual schedule
// GET  /api/partner/schedule    — get partner schedule
// GET  /api/partner/best-windows — get best date windows
// DELETE /api/partner           — remove partner
// ══════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// ── Connect / update partner ──────────────────────
router.post('/connect', authMiddleware, async (req, res) => {
  const { partner_name, partner_email, visibility } = req.body;

  const { data, error } = await supabase
    .from('partners')
    .upsert({
      user_id: req.user.id,
      partner_name,
      partner_email,
      visibility: visibility || {
        show_phase: true,
        show_mood: true,
        show_energy: true,
        show_symptoms: false,
        show_skin: false
      },
      connected: true
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `Connected with ${partner_name}!`, partner: data });
});

// ── Get partner info ──────────────────────────────
router.get('/info', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.json({ partner: null });
  res.json({ partner: data });
});

// ── Update privacy/visibility settings ───────────
router.patch('/visibility', authMiddleware, async (req, res) => {
  const { visibility } = req.body;

  const { data, error } = await supabase
    .from('partners')
    .update({ visibility })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Privacy settings updated', partner: data });
});

// ── Send nudge ────────────────────────────────────
router.post('/nudge', authMiddleware, async (req, res) => {
  const { message, mood } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // Get partner's user_id (in a real app, partner would also have an account)
  const { data: partnerData } = await supabase
    .from('partners')
    .select('partner_email')
    .eq('user_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('nudges')
    .insert({
      sender_id: req.user.id,
      receiver_email: partnerData?.partner_email || null,
      message,
      mood: mood || null
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Nudge sent! 💬', nudge: data });
});

// ── Get nudge history ─────────────────────────────
router.get('/nudges', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('nudges')
    .select('*')
    .eq('sender_id', req.user.id)
    .order('sent_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Mark nudge as read ────────────────────────────
router.patch('/nudges/:id/read', authMiddleware, async (req, res) => {
  await supabase.from('nudges').update({ read: true }).eq('id', req.params.id);
  res.json({ message: 'Marked as read' });
});

// ── Save manual partner schedule ──────────────────
router.post('/schedule', authMiddleware, async (req, res) => {
  // schedule = [{ day: 'Monday', status: 'busy', hours: '9am-6pm' }, ...]
  const { schedule } = req.body;

  const { data, error } = await supabase
    .from('partners')
    .update({ schedule })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Schedule saved!', data });
});

// ── Get partner schedule ──────────────────────────
router.get('/schedule', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('partners')
    .select('schedule, partner_name')
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.json({ schedule: [] });
  res.json(data);
});

// ── Calculate best date windows ───────────────────
router.get('/best-windows', authMiddleware, async (req, res) => {
  const { data: cycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  const { data: partner } = await supabase
    .from('partners')
    .select('schedule, partner_name')
    .eq('user_id', req.user.id)
    .single();

  if (!cycle) return res.status(404).json({ error: 'No cycle data' });

  // Calculate current day in cycle
  const today = new Date();
  const start = new Date(cycle.period_start);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const dayInCycle = (diffDays % cycle.cycle_length) + 1;

  // Score windows based on upcoming days
  const windows = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = days[date.getDay()];
    const futureDayInCycle = ((dayInCycle + i - 1) % cycle.cycle_length) + 1;

    // Determine phase score
    let phaseScore = 0;
    if (futureDayInCycle >= 10 && futureDayInCycle <= 16) phaseScore = 10; // Follicular peak + Ovulatory
    else if (futureDayInCycle >= 7 && futureDayInCycle <= 9)  phaseScore = 7;
    else if (futureDayInCycle >= 17 && futureDayInCycle <= 20) phaseScore = 6;
    else if (futureDayInCycle <= 5)  phaseScore = 3; // Menstrual
    else phaseScore = 4; // Late Luteal

    // Check partner availability
    const partnerSchedule = partner?.schedule || [];
    const partnerDay = partnerSchedule.find(s => s.day === dayName);
    const partnerFree = !partnerDay || partnerDay.status === 'free';
    const partnerScore = partnerFree ? 10 : 0;

    const totalScore = ((phaseScore + partnerScore) / 2).toFixed(1);
    const isBestWindow = phaseScore >= 8 && partnerFree;

    windows.push({
      date: date.toISOString().split('T')[0],
      dayName,
      dayInCycle: futureDayInCycle,
      phaseScore,
      partnerFree,
      score: parseFloat(totalScore),
      isBestWindow
    });
  }

  windows.sort((a, b) => b.score - a.score);
  res.json({ windows, partnerName: partner?.partner_name || 'Partner' });
});

// ── Remove partner ────────────────────────────────
router.delete('/', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Partner removed' });
});

module.exports = router;
