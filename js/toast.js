// ══════════════════════════════════════════════════
// GenFlo — Toast Notification System (Sonner-style)
// Include on every page: <script src="js/toast.js"></script>
// Usage:
//   toast('Message')                     → default
//   toast.success('Saved!')
//   toast.error('Something went wrong')
//   toast.info('FYI message')
//   toast.warning('Watch out')
//   toast.confirm('Are you sure?', onConfirm, onCancel)
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Inject styles once ──────────────────────────
  const STYLE_ID = 'gf-toast-styles';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #gf-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        pointer-events: none;
      }
      .gf-toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 280px;
        max-width: 380px;
        padding: 14px 18px;
        background: #fff;
        border: 1px solid rgba(58,61,53,0.1);
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(58,61,53,0.12), 0 2px 8px rgba(58,61,53,0.06);
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.875rem;
        color: #3a3d35;
        line-height: 1.45;
        pointer-events: auto;
        cursor: default;
        transform: translateX(110%);
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
        will-change: transform, opacity;
        overflow: hidden;
        position: relative;
      }
      .gf-toast.gf-toast-in {
        transform: translateX(0);
        opacity: 1;
      }
      .gf-toast.gf-toast-out {
        transform: translateX(110%);
        opacity: 0;
        transition: transform 0.28s ease, opacity 0.2s ease;
      }
      .gf-toast-icon {
        font-size: 1.05rem;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .gf-toast-body { flex: 1; }
      .gf-toast-title {
        font-weight: 600;
        font-size: 0.875rem;
        color: #3a3d35;
        display: block;
        margin-bottom: 2px;
      }
      .gf-toast-msg {
        font-size: 0.825rem;
        color: #7a7d72;
        display: block;
      }
      .gf-toast-close {
        background: none; border: none; cursor: pointer;
        color: #7a7d72; font-size: 1rem; padding: 0;
        line-height: 1; flex-shrink: 0; margin-top: -1px;
        transition: color 0.2s;
      }
      .gf-toast-close:hover { color: #3a3d35; }
      .gf-toast-progress {
        position: absolute;
        bottom: 0; left: 0;
        height: 3px;
        border-radius: 0 0 14px 14px;
        transform-origin: left;
        transition: transform linear;
      }
      /* Type colours */
      .gf-toast-success .gf-toast-progress { background: #5e7a5c; }
      .gf-toast-success .gf-toast-icon { color: #5e7a5c; }
      .gf-toast-error .gf-toast-progress { background: #c97c5d; }
      .gf-toast-error .gf-toast-icon { color: #c97c5d; }
      .gf-toast-info .gf-toast-progress { background: #6b8fa0; }
      .gf-toast-info .gf-toast-icon { color: #6b8fa0; }
      .gf-toast-warning .gf-toast-progress { background: #c9a25d; }
      .gf-toast-warning .gf-toast-icon { color: #c9a25d; }
      .gf-toast-default .gf-toast-progress { background: #8fac8d; }
      .gf-toast-default .gf-toast-icon { color: #3a3d35; }

      /* ── Confirm dialog ── */
      .gf-confirm-backdrop {
        position: fixed; inset: 0;
        background: rgba(58,61,53,0.35);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        animation: gfFadeIn 0.2s ease;
      }
      .gf-confirm-box {
        background: #fff;
        border-radius: 20px;
        padding: 32px;
        max-width: 360px; width: 90%;
        box-shadow: 0 24px 60px rgba(58,61,53,0.18);
        animation: gfSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
        font-family: 'Inter', system-ui, sans-serif;
        text-align: center;
      }
      .gf-confirm-icon { font-size: 2.2rem; margin-bottom: 12px; }
      .gf-confirm-title {
        font-size: 1rem; font-weight: 600;
        color: #3a3d35; margin-bottom: 8px;
      }
      .gf-confirm-msg {
        font-size: 0.875rem; color: #7a7d72;
        margin-bottom: 24px; line-height: 1.55;
      }
      .gf-confirm-actions {
        display: flex; gap: 10px; justify-content: center;
      }
      .gf-confirm-cancel {
        padding: 10px 22px;
        border: 1.5px solid rgba(143,172,141,0.35);
        border-radius: 100px;
        background: none;
        font-size: 0.875rem; font-weight: 500;
        color: #7a7d72; cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      }
      .gf-confirm-cancel:hover { border-color: #8fac8d; color: #3a3d35; }
      .gf-confirm-ok {
        padding: 10px 22px;
        border: none; border-radius: 100px;
        background: linear-gradient(135deg, #5e7a5c, #8fac8d);
        color: #fff;
        font-size: 0.875rem; font-weight: 500;
        cursor: pointer; font-family: inherit;
        transition: all 0.2s;
        box-shadow: 0 4px 16px rgba(94,122,92,0.3);
      }
      .gf-confirm-ok:hover { opacity: 0.88; transform: translateY(-1px); }
      .gf-confirm-ok.danger {
        background: linear-gradient(135deg, #c97c5d, #e0a085);
        box-shadow: 0 4px 16px rgba(201,124,93,0.3);
      }
      @keyframes gfFadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes gfSlideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
    `;
    document.head.appendChild(style);
  }

  // ── Container ───────────────────────────────────
  function getContainer() {
    let c = document.getElementById('gf-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'gf-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  // ── Icon map ────────────────────────────────────
  const ICONS = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
    default: '◆',
  };

  // ── Core show function ──────────────────────────
  function show(message, type = 'default', duration = 4000) {
    const container = getContainer();

    const el = document.createElement('div');
    el.className = `gf-toast gf-toast-${type}`;

    el.innerHTML = `
      <span class="gf-toast-icon">${ICONS[type] || ICONS.default}</span>
      <span class="gf-toast-body">
        <span class="gf-toast-msg">${message}</span>
      </span>
      <button class="gf-toast-close" aria-label="Dismiss">✕</button>
      <span class="gf-toast-progress"></span>
    `;

    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('gf-toast-in'));
    });

    // Progress bar
    const bar = el.querySelector('.gf-toast-progress');
    bar.style.width = '100%';
    bar.style.transform = 'scaleX(1)';
    setTimeout(() => {
      bar.style.transition = `transform ${duration}ms linear`;
      bar.style.transform = 'scaleX(0)';
    }, 50);

    // Dismiss
    function dismiss() {
      el.classList.remove('gf-toast-in');
      el.classList.add('gf-toast-out');
      setTimeout(() => el.remove(), 300);
    }

    const timer = setTimeout(dismiss, duration);

    el.querySelector('.gf-toast-close').addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });

    return { dismiss };
  }

  // ── Confirm dialog ──────────────────────────────
  function confirm(message, onConfirm, onCancel, { danger = false } = {}) {
    const backdrop = document.createElement('div');
    backdrop.className = 'gf-confirm-backdrop';
    backdrop.innerHTML = `
      <div class="gf-confirm-box" role="dialog" aria-modal="true">
        <div class="gf-confirm-icon">${danger ? '🗑️' : '💬'}</div>
        <div class="gf-confirm-title">${danger ? 'Are you sure?' : 'Confirm'}</div>
        <div class="gf-confirm-msg">${message}</div>
        <div class="gf-confirm-actions">
          <button class="gf-confirm-cancel" id="gf-confirm-cancel">Cancel</button>
          <button class="gf-confirm-ok${danger ? ' danger' : ''}" id="gf-confirm-ok">${danger ? 'Remove' : 'Confirm'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    function close() { backdrop.remove(); }

    backdrop.querySelector('#gf-confirm-ok').addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
    backdrop.querySelector('#gf-confirm-cancel').addEventListener('click', () => {
      close();
      if (typeof onCancel === 'function') onCancel();
    });
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) { close(); if (typeof onCancel === 'function') onCancel(); }
    });
  }

  // ── Public API ──────────────────────────────────
  const toast = (msg, opts) => show(msg, 'default', opts?.duration);
  toast.success = (msg, opts) => show(msg, 'success', opts?.duration || 4000);
  toast.error   = (msg, opts) => show(msg, 'error',   opts?.duration || 5000);
  toast.info    = (msg, opts) => show(msg, 'info',    opts?.duration || 4000);
  toast.warning = (msg, opts) => show(msg, 'warning', opts?.duration || 4500);
  toast.confirm = confirm;

  window.toast = toast;

})();
