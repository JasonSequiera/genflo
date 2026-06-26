// ══════════════════════════════════════════════════
// GenFlo — Main JavaScript
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Nav scroll effect ──────────────────────────
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ── Mobile menu toggle ─────────────────────────
  const burger = document.getElementById('nav-burger');
  const mobileMenu = document.getElementById('nav-mobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // ── Phase card interactions ────────────────────
  document.querySelectorAll('.phase-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.phase-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // ── Smooth reveal on scroll ────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.bento-card, .phase-card, .preview-split, .aria-split').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

});

// ── Reveal CSS inject ──────────────────────────
const style = document.createElement('style');
style.textContent = `
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);
