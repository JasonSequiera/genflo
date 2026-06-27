/**
 * GenFlo — Aria Floating Chat Widget
 * Injected on all pages as a persistent bottom-right popup
 */
(function () {
  const REPLIES = [
    "Based on your cycle data, today is a great day to try a gentle brightening serum!",
    "Your energy is peaking right now — perfect for social activities and creative projects.",
    "During your Ovulatory phase, antioxidant-rich foods like berries and leafy greens are your best friends.",
    "I've noted that. Would you like me to add any more details to today's log?",
    "You're approaching your Luteal phase in a few days — I'll send you some preparation tips soon.",
    "Remember to stay hydrated today — it supports your hormonal balance throughout the cycle.",
    "Great question! Let me pull up the latest insights for your current phase."
  ];
  let replyIdx = 0;
  let isOpen = false;

  const html = `
  <div class="aria-float-widget" id="aria-float-widget">
    <div class="aria-float-panel" id="aria-float-panel">
      <div class="aria-float-header">
        <div class="aria-float-avatar">A</div>
        <div>
          <div class="aria-float-name">Aria</div>
          <div class="aria-float-status">Your AI companion</div>
        </div>
        <button class="aria-float-close" id="aria-float-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="aria-float-messages" id="aria-float-messages">
        <div class="aria-float-msg aria-msg">
          <div class="float-msg-bubble">Hi! I'm Aria, your GenFlo companion. How can I support you today?</div>
        </div>
      </div>
      <div class="aria-float-suggestions" id="aria-float-suggestions">
        <button class="aria-float-chip" data-msg="How is my skin today?">How is my skin today?</button>
        <button class="aria-float-chip" data-msg="What should I eat?">What should I eat?</button>
        <button class="aria-float-chip" data-msg="Log my symptoms">Log symptoms</button>
      </div>
      <div class="aria-float-input-row">
        <input type="text" id="aria-float-input" placeholder="Ask Aria anything..." aria-label="Message Aria" />
        <button class="aria-float-send" id="aria-float-send" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
    <button class="aria-float-toggle" id="aria-float-toggle" aria-label="Chat with Aria">
      <div class="aria-toggle-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="aria-toggle-label">Ask Aria</div>
      <div class="aria-float-badge" id="aria-float-badge">1</div>
    </button>
  </div>`;

  // Inject widget
  document.body.insertAdjacentHTML('beforeend', html);

  const toggle = document.getElementById('aria-float-toggle');
  const panel = document.getElementById('aria-float-panel');
  const closeBtn = document.getElementById('aria-float-close');
  const input = document.getElementById('aria-float-input');
  const sendBtn = document.getElementById('aria-float-send');
  const messages = document.getElementById('aria-float-messages');
  const badge = document.getElementById('aria-float-badge');
  const suggestions = document.getElementById('aria-float-suggestions');

  function openPanel() {
    panel.classList.add('open');
    badge.style.display = 'none';
    isOpen = true;
    input.focus();
  }
  function closePanel() {
    panel.classList.remove('open');
    isOpen = false;
  }

  toggle.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  function appendMessage(text, type) {
    const div = document.createElement('div');
    div.className = 'aria-float-msg ' + type;
    div.innerHTML = `<div class="float-msg-bubble">${text}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage(text) {
    const msg = (text || input.value).trim();
    if (!msg) return;
    suggestions.style.display = 'none';
    appendMessage(msg, 'user-msg');
    input.value = '';
    setTimeout(() => {
      appendMessage(REPLIES[replyIdx % REPLIES.length], 'aria-msg');
      replyIdx++;
    }, 750);
  }

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  suggestions.querySelectorAll('.aria-float-chip').forEach(chip => {
    chip.addEventListener('click', () => sendMessage(chip.dataset.msg));
  });
})();
