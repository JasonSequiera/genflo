// ══════════════════════════════════════════════════
// GenFlo — Shared Navbar Component
// Renders a consistent navbar across all app pages.
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  const NAV_ITEMS = [
    { label: 'Home',     href: 'dashboard.html', icon: '🏠' },
    { label: 'Cycle',    href: 'cycle.html',     icon: '🌙' },
    { label: 'Skin',     href: 'skin.html',      icon: '✨' },
    { label: 'Wellness', href: 'wellness.html',  icon: '🥗' },
    { label: 'Partner',  href: 'partner.html',   icon: '💑' },
    { label: 'Aria',     href: 'aria.html',      icon: '🤖' },
  ];

  /**
   * Determine which nav item is active based on the current page filename.
   */
  function getActiveHref() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return file;
  }

  /**
   * Get user first name from session (GenFloAPI expected to be loaded).
   */
  function getUserName() {
    if (typeof GenFloAPI !== 'undefined' && GenFloAPI.getUser) {
      const user = GenFloAPI.getUser();
      return user?.name?.split(' ')[0] || 'User';
    }
    return 'User';
  }

  /**
   * Get user initials for the profile avatar.
   */
  function getUserInitials() {
    if (typeof GenFloAPI !== 'undefined' && GenFloAPI.getUser) {
      const user = GenFloAPI.getUser();
      if (user?.name) {
        const parts = user.name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
      }
    }
    return 'U';
  }

  /**
   * Handle sign out.
   */
  function handleSignOut() {
    if (typeof GenFloAPI !== 'undefined' && GenFloAPI.clearSession) {
      GenFloAPI.clearSession();
    } else {
      window.location.href = 'login.html';
    }
  }

  /**
   * Build and inject the navbar into the page.
   */
  function renderNavbar() {
    const activeFile = getActiveHref();
    const userName = getUserName();
    const initials = getUserInitials();

    // Build nav links
    const linksHTML = NAV_ITEMS.map(item => {
      const isActive = activeFile === item.href;
      return `<li><a href="${item.href}" class="gf-nav-link${isActive ? ' active' : ''}"><span class="gf-nav-icon">${item.icon}</span>${item.label}</a></li>`;
    }).join('');

    // Mobile links
    const mobileLinksHTML = NAV_ITEMS.map(item => {
      const isActive = activeFile === item.href;
      return `<a href="${item.href}" class="gf-mobile-link${isActive ? ' active' : ''}"><span class="gf-nav-icon">${item.icon}</span>${item.label}</a>`;
    }).join('');

    const navHTML = `
    <nav id="main-nav" class="gf-navbar">
      <div class="gf-navbar-inner">
        <a href="dashboard.html" class="gf-navbar-logo">
          <span class="gf-logo-mark">⬡</span>GenFlo
        </a>

        <ul class="gf-nav-links">
          ${linksHTML}
        </ul>

        <div class="gf-nav-right">
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
              <a href="dashboard.html" class="gf-dropdown-item">
                <span>🏠</span> Dashboard
              </a>
              <a href="onboarding.html" class="gf-dropdown-item">
                <span>⚙️</span> Settings
              </a>
              <div class="gf-dropdown-divider"></div>
              <button class="gf-dropdown-item gf-signout-btn" id="gf-signout-btn">
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>

        <button class="gf-burger" id="gf-burger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="gf-mobile-menu" id="gf-mobile-menu">
        ${mobileLinksHTML}
        <div class="gf-mobile-divider"></div>
        <div class="gf-mobile-profile">
          <div class="gf-avatar">${initials}</div>
          <span>${userName}</span>
        </div>
        <button class="gf-mobile-signout" id="gf-mobile-signout">🚪 Sign Out</button>
      </div>
    </nav>
    `;

    // Find existing nav and replace, or prepend to body
    const existingNav = document.getElementById('main-nav');
    if (existingNav) {
      existingNav.outerHTML = navHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    // Remove old dash-nav if it exists (dashboard.html had a separate tab nav)
    const dashNav = document.querySelector('.dash-nav');
    if (dashNav) dashNav.remove();

    // ── Event Listeners ──
    // Profile dropdown toggle
    const trigger = document.getElementById('gf-profile-trigger');
    const dropdown = document.getElementById('gf-profile-dropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        trigger.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove('open');
          trigger.classList.remove('open');
        }
      });
    }

    // Sign out buttons
    const signoutBtn = document.getElementById('gf-signout-btn');
    if (signoutBtn) signoutBtn.addEventListener('click', handleSignOut);
    const mobileSignout = document.getElementById('gf-mobile-signout');
    if (mobileSignout) mobileSignout.addEventListener('click', handleSignOut);

    // Burger menu
    const burger = document.getElementById('gf-burger');
    const mobileMenu = document.getElementById('gf-mobile-menu');
    if (burger && mobileMenu) {
      burger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        burger.classList.toggle('open');
      });
    }

    // Scroll effect
    const navbar = document.getElementById('main-nav');
    if (navbar) {
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
      });
    }
  }

  // Make handleSignOut globally available for any inline onclick handlers
  window.handleSignOut = handleSignOut;

  // Render on DOM ready or immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }

})();
