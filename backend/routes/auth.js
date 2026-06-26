// ══════════════════════════════════════════════════
// GenFlo — Auth Routes
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me
// ══════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// ── Register ──────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  // Create profile in our profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: authData.user.id, name, email });

  if (profileError) {
    return res.status(500).json({ error: 'Failed to create profile' });
  }

  // Sign a JWT
  const token = jwt.sign(
    { id: authData.user.id, email, name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: { id: authData.user.id, name, email }
  });
});

// ── Login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', data.user.id)
    .single();

  const token = jwt.sign(
    { id: data.user.id, email: data.user.email, name: profile?.name || 'User' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: { id: data.user.id, name: profile?.name, email: data.user.email }
  });
});

// ── Get current user ──────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

module.exports = router;
