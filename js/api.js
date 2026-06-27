// ══════════════════════════════════════════════════
// GenFlo — Frontend API Helper
// Include this on every page: <script src="/js/api.js"></script>
// ══════════════════════════════════════════════════

const API_BASE = 'https://genflo.onrender.com/api';

const GenFloAPI = {

  // ── Auth helpers ──────────────────────────────
  getToken: () => localStorage.getItem('genflo_token'),
  getUser: () => JSON.parse(localStorage.getItem('genflo_user') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('genflo_token'),

  saveSession(token, user) {
    localStorage.setItem('genflo_token', token);
    localStorage.setItem('genflo_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('genflo_token');
    localStorage.removeItem('genflo_user');
    window.location.href = '/login.html';
  },

  // ── Core fetch wrapper ──────────────────────────
  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (res.status === 401) {
        this.clearSession(); // Token expired → redirect to login
        return null;
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      return null;
    }
  },

  get: (path) => GenFloAPI.request('GET', path),
  post: (path, body) => GenFloAPI.request('POST', path, body),
  patch: (path, body) => GenFloAPI.request('PATCH', path, body),
  delete: (path) => GenFloAPI.request('DELETE', path),

  // ── Auth ─────────────────────────────────────
  async register(name, email, password) {
    const data = await this.post('/auth/register', { name, email, password });
    if (data?.token) this.saveSession(data.token, data.user);
    return data;
  },

  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    if (data?.token) this.saveSession(data.token, data.user);
    return data;
  },

  // ── Cycle ─────────────────────────────────────
  getCycle: () => GenFloAPI.get('/cycle/current'),
  setupCycle: (body) => GenFloAPI.post('/cycle/setup', body),
  getCalendar: (month, year) => GenFloAPI.get(`/cycle/calendar?month=${month}&year=${year}`),

  // ── Logs ──────────────────────────────────────
  saveLog: (body) => GenFloAPI.post('/logs/daily', body),
  getTodayLog: () => GenFloAPI.get('/logs/today'),
  getLogHistory: (days = 30) => GenFloAPI.get(`/logs/history?days=${days}`),
  saveSupplementLog: (body) => GenFloAPI.post('/logs/supplements', body),
  getSupplements: () => GenFloAPI.get('/logs/supplements'),

  // ── Aria ──────────────────────────────────────
  ariaChat: (message) => GenFloAPI.post('/aria/chat', { message }),
  ariaHistory: () => GenFloAPI.get('/aria/history'),
  ariaDailyInsight: () => GenFloAPI.get('/aria/daily-insight'),

  // ── Partner ───────────────────────────────────
  connectPartner: (body) => GenFloAPI.post('/partner/connect', body),
  getPartner: () => GenFloAPI.get('/partner/info'),
  sendNudge: (message, mood) => GenFloAPI.post('/partner/nudge', { message, mood }),
  getNudges: () => GenFloAPI.get('/partner/nudges'),
  saveSchedule: (schedule) => GenFloAPI.post('/partner/schedule', { schedule }),
  getSchedule: () => GenFloAPI.get('/partner/schedule'),
  getBestWindows: () => GenFloAPI.get('/partner/best-windows'),
  updateVisibility: (visibility) => GenFloAPI.patch('/partner/visibility', { visibility }),
  removePartner: () => GenFloAPI.delete('/partner'),

  // ── Date Ideas ────────────────────────────────
  generateDates: (body) => GenFloAPI.post('/dates/generate', body),
  saveDate: (body) => GenFloAPI.post('/dates/save', body),
  getSavedDates: () => GenFloAPI.get('/dates/saved'),
  planDate: (id, planned_date) => GenFloAPI.patch(`/dates/${id}/plan`, { planned_date }),
  deleteDate: (id) => GenFloAPI.delete(`/dates/${id}`)
};

// ── Auto-load cycle data into page ───────────────
async function loadCycleContext() {
  if (!GenFloAPI.isLoggedIn()) return;
  const cycle = await GenFloAPI.getCycle();
  if (cycle && cycle.phase) {
    // Update any element with data-cycle-* attributes
    document.querySelectorAll('[data-cycle-day]').forEach(el => {
      el.textContent = `Day ${cycle.dayInCycle}`;
    });
    document.querySelectorAll('[data-cycle-phase]').forEach(el => {
      el.textContent = cycle.phase;
    });
    document.querySelectorAll('[data-cycle-next-period]').forEach(el => {
      el.textContent = `in ${cycle.daysUntilNextPeriod} days`;
    });
    document.querySelectorAll('[data-cycle-next-phase]').forEach(el => {
      el.textContent = `${cycle.nextPhase} in ${cycle.daysUntilNextPhase}d`;
    });
    // Store in window for other scripts to use
    window.cycleData = cycle;
  }
}

// ── Auto-load user greeting ───────────────────────
function loadUserGreeting() {
  const user = GenFloAPI.getUser();
  if (user) {
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = user.name;
    });
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUserGreeting();
  loadCycleContext();
});
