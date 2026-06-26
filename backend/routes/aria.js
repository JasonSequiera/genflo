// ══════════════════════════════════════════════════
// GenFlo — Aria AI Routes (powered by Gemini)
// POST /api/aria/chat        — send message, get AI reply
// GET  /api/aria/history     — get chat history
// GET  /api/aria/daily-insight — get today's insight
// ══════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Simple in-memory cache for daily insight ──────
const insightCache = {}; // { userId: { insight, phase, dayInCycle, cachedAt } }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Helper: Get user's cycle context ─────────────
async function getCycleContext(userId) {
  const { data: cycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!cycle) return { phase: 'Unknown', dayInCycle: 1, cycleLength: 28 };

  const today = new Date();
  const start = new Date(cycle.period_start);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const dayInCycle = (diffDays % cycle.cycle_length) + 1;

  let phase;
  if (dayInCycle <= 5)        phase = 'Menstrual';
  else if (dayInCycle <= 13)  phase = 'Follicular';
  else if (dayInCycle <= 16)  phase = 'Ovulatory';
  else                        phase = 'Luteal';

  return { phase, dayInCycle, cycleLength: cycle.cycle_length, conditions: cycle.conditions };
}

// ── Chat with Aria ────────────────────────────────
router.post('/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const { phase, dayInCycle, conditions } = await getCycleContext(req.user.id);
    const conditionText = conditions && conditions.length
      ? `She manages: ${conditions.join(', ')}.` : '';

    const systemInstruction = `You are Aria, a warm, knowledgeable and compassionate AI health companion for GenFlo — a menstrual wellness app.

The user's current status:
- Name: ${req.user.name}
- Cycle Day: ${dayInCycle}
- Phase: ${phase}
${conditionText}

Your role:
- Provide personalized, science-backed hormonal health advice
- Give specific skincare, nutrition, and fitness tips tailored to their current phase
- Offer emotional support and mood check-ins
- Help plan romantic activities with their partner
- Log symptoms (acknowledge when they mention symptoms)
- Be warm, friendly and use occasional gentle emojis 🌿
- Keep responses concise (under 150 words unless asked for detail)
- NEVER diagnose medical conditions — always recommend a doctor for medical concerns
- NEVER make up medical facts`;

    // Get recent chat history for context
    const { data: history } = await supabase
      .from('aria_messages')
      .select('role, content')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(8);

    const chatHistory = (history || []).reverse().map(m => ({
      role: m.role === 'aria' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction
    });

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const ariaReply = result.response.text();

    // Save both messages to database
    await supabase.from('aria_messages').insert([
      { user_id: req.user.id, role: 'user', content: message },
      { user_id: req.user.id, role: 'aria', content: ariaReply }
    ]);

    res.json({
      reply: ariaReply,
      context: { phase, dayInCycle }
    });

  } catch (err) {
    console.error('Aria error:', err.message);
    const isQuota = err.message && (err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('rate'));
    res.status(500).json({
      error: isQuota
        ? 'Aria has hit the free API rate limit. Please wait a minute and try again.'
        : 'Aria is temporarily unavailable. Please try again.'
    });
  }
});

// ── Chat History ──────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('aria_messages')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Daily Insight ─────────────────────────────────
router.get('/daily-insight', authMiddleware, async (req, res) => {
  let phase = 'Follicular', dayInCycle = 1; // safe defaults if getCycleContext throws
  try {
    ({ phase, dayInCycle } = await getCycleContext(req.user.id));

    // Return cached insight if fresh
    const cached = insightCache[req.user.id];
    if (cached && cached.phase === phase && (Date.now() - cached.cachedAt) < CACHE_TTL_MS) {
      return res.json({ insight: cached.insight, phase, dayInCycle, cached: true });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const prompt = `Generate a warm, personalized daily health insight for ${req.user.name} who is on Day ${dayInCycle} of their menstrual cycle in the ${phase} phase. 
    
    Include: what's happening hormonally, one skin tip, one nutrition tip, and one energy/mood expectation.
    Format as flowing text (no bullet points), keep it under 100 words, warm and encouraging tone with one emoji.`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text();

    // Store in cache
    insightCache[req.user.id] = { insight, phase, dayInCycle, cachedAt: Date.now() };

    res.json({ insight, phase, dayInCycle });
  } catch (err) {
    console.error('Daily insight error:', err.message);
    const isQuota = err.message && (
      err.message.includes('quota') ||
      err.message.includes('RESOURCE_EXHAUSTED') ||
      err.message.includes('rate') ||
      err.message.includes('API_KEY_INVALID') ||
      err.message.includes('expired')
    );
    const fallbacks = {
      'Menstrual': 'Your body is in its rest phase — honour that today. 🌿 Iron-rich foods like lentils and spinach support your energy. Keep skincare gentle and hydrating. Expect lower energy; this is normal and temporary.',
      'Follicular': 'Estrogen is rising and so is your energy! 🌱 Your skin is clearing and glowing. Great time for lighter, fresh foods and starting new projects. Motivation builds naturally over the next few days.',
      'Ovulatory': "You're at peak estrogen — confidence, glow and social energy are all high! ✨ Your skin is radiant; protect it with SPF. Lean into colourful, antioxidant-rich foods. Best time for big conversations and plans.",
      'Luteal': 'Progesterone is rising as your body prepares. 🌙 Skin may feel oilier — use a gentle balancing serum. Magnesium-rich foods like dark chocolate and nuts help with mood. Prioritise rest and calm activities.'
    };
    res.json({
      insight: fallbacks[phase] || fallbacks['Follicular'],
      phase,
      dayInCycle,
      rateLimited: isQuota
    });
  }
});

module.exports = router;
