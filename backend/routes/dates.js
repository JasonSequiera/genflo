// ══════════════════════════════════════════════════
// GenFlo — AI Date Ideas Routes
// POST /api/dates/generate  — AI generates date ideas
// POST /api/dates/save      — save a date idea
// GET  /api/dates/saved     — list saved dates
// PATCH /api/dates/:id/plan — mark as planned
// DELETE /api/dates/:id     — remove saved date
// ══════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Generate AI date ideas ────────────────────────
router.post('/generate', authMiddleware, async (req, res) => {
  const { timeSlot, budgetVibe, extraContext, partnerName } = req.body;

  // Get cycle context
  const { data: cycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  const today = new Date();
  const start = new Date(cycle?.period_start || today);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const dayInCycle = cycle ? (diffDays % cycle.cycle_length) + 1 : 14;

  let phase = 'Ovulatory';
  if (dayInCycle <= 5)        phase = 'Menstrual';
  else if (dayInCycle <= 13)  phase = 'Follicular';
  else if (dayInCycle <= 16)  phase = 'Ovulatory';
  else                        phase = 'Luteal';

  const prompt = `Generate exactly 3 date ideas for a couple. 

Context:
- User's cycle phase: ${phase} (Day ${dayInCycle})
- Time slot: ${timeSlot || 'Any free evening'}
- Budget/vibe: ${budgetVibe || 'Outdoorsy, moderate budget'}
- Partner name: ${partnerName || 'Partner'}
- Extra context: ${extraContext || 'None'}

For each date idea, provide EXACTLY this JSON structure:
{
  "title": "Date name",
  "when": "Specific time suggestion",
  "where": "Specific location/place type",
  "description": "2-sentence description",
  "score": 8.7,
  "tags": ["tag1", "tag2", "tag3"],
  "jamieTip": "Specific behavioral advice for ${partnerName || 'the partner'} based on the ${phase} phase hormones"
}

Respond with a JSON array of 3 ideas only. No extra text.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Strip markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const ideas = JSON.parse(text);
    res.json({ ideas, phase, dayInCycle });

  } catch (err) {
    console.error('Date generation error:', err.message);
    // Fallback ideas if AI fails
    res.json({
      ideas: [
        {
          title: 'Sunset Picnic at the Park',
          when: `${timeSlot || 'Friday'} at 5:30pm`,
          where: 'Local riverside park or open green space',
          description: 'Pack a beautiful picnic basket with your favourite snacks and watch the sunset together. Low pressure, deeply romantic and perfect for meaningful conversation.',
          score: 9.1,
          tags: ['🌿 Outdoorsy', '💆 Low Pressure', '✨ Romantic'],
          jamieTip: `Let ${partnerName || 'her'} lead the pace and choose the spot. Bring a surprise element — her favourite snack or a small gift.`
        }
      ],
      phase,
      dayInCycle
    });
  }
});

// ── Save a date idea ──────────────────────────────
router.post('/save', authMiddleware, async (req, res) => {
  const { title, description, score, tags, jamie_tip, when, where_desc } = req.body;

  const { data, error } = await supabase
    .from('saved_dates')
    .insert({
      user_id: req.user.id,
      title,
      description,
      score,
      tags: tags || [],
      jamie_tip,
      when_suggestion: when,
      where_suggestion: where_desc
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Date saved! 💾', date: data });
});

// ── Get saved dates ───────────────────────────────
router.get('/saved', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('saved_dates')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Plan a date (mark + set date) ─────────────────
router.patch('/:id/plan', authMiddleware, async (req, res) => {
  const { planned_date } = req.body;

  const { data, error } = await supabase
    .from('saved_dates')
    .update({ planned: true, planned_date })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Date planned! 📅', date: data });
});

// ── Delete a saved date ───────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('saved_dates')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Removed' });
});

module.exports = router;
