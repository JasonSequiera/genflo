// ══════════════════════════════════════════════════
// GenFlo — Shared Navbar Component
// Auth-aware: shows Sign In/Begin Journey for guests,
// profile avatar/dropdown for logged-in users.
// Matches the clean design of index.html (no emoji icons).
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  // Nav items for authenticated (inner app) pages
  const APP_NAV_ITEMS = [
    { label: 'Home',     href: 'dashboard.html' },
    { label: 'Cycle',    href: 'cycle.html'     },
    { label: 'Skin',     href: 'skin.html'      },
    { label: 'Wellness', href: 'wellness.html'  },
    { label: 'Partner',  href: 'partner.html'   },
    { label: 'Ask Aria', href: 'aria.html'      },
  ];

  /**
   * Get current page filename.
   */
  function getActiveHref() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  }

  /**
   * Check auth state from localStorage (mirrors GenFloAPI).
   */
  function isLoggedIn() {
    // Use GenFloAPI if available, otherwise fall back to direct localStorage check
    if (typeof GenFloAPI !== 'undefined' && GenFloAPI.isLoggedIn) {
      return GenFloAPI.isLoggedIn();
    }
    return !!localStorage.getItem('genflo_token');
  }

  function getUser() {
    if (typeof GenFloAPI !== 'undefined' && GenFloAPI.getUser) {
      return GenFloAPI.getUser();
    }
    try {
      return JSON.parse(localStorage.getItem('genflo_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function getUserName() {
    const user = getUser();
    return user?.name?.split(' ')[0] || 'User';
  }

  function getUserInitials() {
    const user = getUser();
    if (user?.name) {
      const parts = user.name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return 'U';
  }

  function handleSignOut() {
    if (typeof GenFloAPI !== 'undefined' && GenFloAPI.clearSession) {
      GenFloAPI.clearSession();
    } else {
      localStorage.removeItem('genflo_token');
      localStorage.removeItem('genflo_user');
      window.location.href = 'login.html';
    }
  }

  /**
   * Build and inject the navbar into the page.
   */
  function renderNavbar() {
    const activeFile = getActiveHref();
    const loggedIn   = isLoggedIn();
    const userName   = getUserName();
    const initials   = getUserInitials();

    // ── Nav links (clean, no emoji icons — matches index.html design) ──
    const linksHTML = APP_NAV_ITEMS.map(item => {
      const isActive = activeFile === item.href;
      return `<li><a href="${item.href}" class="gf-nav-link${isActive ? ' active' : ''}">${item.label}</a></li>`;
    }).join('');

    // ── Mobile links ──
    const mobileLinksHTML = APP_NAV_ITEMS.map(item => {
      const isActive = activeFile === item.href;
      return `<a href="${item.href}" class="gf-mobile-link${isActive ? ' active' : ''}">${item.label}</a>`;
    }).join('');

    // ── Right section: profile (logged in) or Sign In + Begin Journey (guest) ──
    let rightHTML;
    let mobileRightHTML;

    if (loggedIn) {
      rightHTML = `
        <div class="gf-profile-menu" id="gf-profile-menu">
          <button class="gf-profile-trigger" id="gf-profile-trigger" aria-label="Profile menu">
            <div class="gf-avatar">${initials}</div>
            <span class="gf-profile-name">${userName}</span>
            <svg class="gf-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="gf-profile-dropdown" id="gf-profile-dropdown">
            <div class="gf-dropdown-header">
              <div class="gf-avatar gf-avatar-lg">${initials}</div>
              <div>
                <div class="gf-dropdown-name">${userName}</div>
                <div class="gf-dropdown-role">GenFlo Member</div>
              </div>
            </div>
            <div class="gf-dropdown-divider"></div>
            <a href="dashboard.html" class="gf-dropdown-item"><span>🏠</span> Dashboard</a>
            <a href="onboarding.html" class="gf-dropdown-item"><span>⚙️</span> Settings</a>
            <div class="gf-dropdown-divider"></div>
            <button class="gf-dropdown-item gf-signout-btn" id="gf-signout-btn"><span>🚪</span> Sign Out</button>
          </div>
        </div>`;

      mobileRightHTML = `
        <div class="gf-mobile-divider"></div>
        <div class="gf-mobile-profile">
          <div class="gf-avatar">${initials}</div>
          <span>${userName}</span>
        </div>
        <button class="gf-mobile-signout" id="gf-mobile-signout">🚪 Sign Out</button>`;
    } else {
      rightHTML = `
        <div class="gf-nav-actions">
          <a href="login.html" class="btn-ghost gf-btn-sm">Sign In</a>
          <a href="onboarding.html" class="btn-primary gf-btn-sm">Begin Journey</a>
        </div>`;

      mobileRightHTML = `
        <div class="gf-mobile-divider"></div>
        <a href="login.html" class="gf-mobile-link">Sign In</a>
        <a href="onboarding.html" class="gf-mobile-link gf-mobile-cta">Begin Journey</a>`;
    }

    const navHTML = `
    <nav id="main-nav" class="gf-navbar">
      <div class="gf-navbar-inner">
        <a href="${loggedIn ? 'dashboard.html' : 'index.html'}" class="gf-navbar-logo">
          <span class="gf-logo-mark">⬡</span>GenFlo
        </a>

        <ul class="gf-nav-links">
          ${linksHTML}
        </ul>

        <div class="gf-nav-right">
          ${rightHTML}
        </div>

        <button class="gf-burger" id="gf-burger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="gf-mobile-menu" id="gf-mobile-menu">
        ${mobileLinksHTML}
        ${mobileRightHTML}
      </div>
    </nav>
    `;

    // Replace existing nav or prepend to body
    const existingNav = document.getElementById('main-nav');
    if (existingNav) {
      existingNav.outerHTML = navHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    // Remove legacy dash-nav if present
    const dashNav = document.querySelector('.dash-nav');
    if (dashNav) dashNav.remove();

    // ── Event Listeners ──

    // Profile dropdown toggle (only when logged in)
    const trigger  = document.getElementById('gf-profile-trigger');
    const dropdown = document.getElementById('gf-profile-dropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        trigger.classList.toggle('open');
      });
      document.addEventListener('click', e => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove('open');
          trigger.classList.remove('open');
        }
      });
    }

    // Sign out buttons
    const signoutBtn    = document.getElementById('gf-signout-btn');
    const mobileSignout = document.getElementById('gf-mobile-signout');
    if (signoutBtn)    signoutBtn.addEventListener('click', handleSignOut);
    if (mobileSignout) mobileSignout.addEventListener('click', handleSignOut);

    // Burger menu
    const burger     = document.getElementById('gf-burger');
    const mobileMenu = document.getElementById('gf-mobile-menu');
    if (burger && mobileMenu) {
      burger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        burger.classList.toggle('open');
      });
    }

    // Scroll shadow
    const navbar = document.getElementById('main-nav');
    if (navbar) {
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
      });
    }
  }

  // Expose handleSignOut globally for any inline onclick handlers
  window.handleSignOut = handleSignOut;

  // Render when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }

})();
