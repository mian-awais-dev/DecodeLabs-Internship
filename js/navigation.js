/**
 * DecodeLabs Project 1 - Navigation Controller
 *
 * Manages mobile hamburger toggle, accessible keyboard trap,
 * outside click dismissal, and active link scroll spying.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = Utils.qs('#hamburger-toggle');
  const navMenu = Utils.qs('#nav-menu');
  const navLinks = Utils.qsa('.nav-link');
  const header = Utils.qs('#site-header');

  if (!hamburgerBtn || !navMenu) {
    console.warn('[Navigation] Hamburger button or nav menu missing from DOM.');
    return;
  }

  // State flag for drawer visibility
  let isMenuOpen = false;

  /**
   * Opens the mobile navigation menu with accessible states.
   */
  function openMenu() {
    isMenuOpen = true;
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Close navigation menu');
    navMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // Prevent body scroll while drawer open

    // Focus the first navigation link for keyboard accessibility
    const firstLink = navMenu.querySelector('a');
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 150);
    }
  }

  /**
   * Closes the mobile navigation menu and restores focus.
   */
  function closeMenu() {
    if (!isMenuOpen) return;
    isMenuOpen = false;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
    navMenu.classList.remove('is-open');
    document.body.style.overflow = ''; // Restore body scroll
    hamburgerBtn.focus();
  }

  /**
   * Toggles the menu state.
   */
  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // 1. Hamburger button click toggle
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // 2. Close when any navigation link is clicked
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (isMenuOpen) {
        closeMenu();
      }
    });
  });

  // 3. Close when clicking outside the navigation menu
  document.addEventListener('click', (event) => {
    if (isMenuOpen && !navMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
      closeMenu();
    }
  });

  // 4. Keyboard Navigation: Escape key closes menu, Tab traps focus
  document.addEventListener('keydown', (event) => {
    if (isMenuOpen) {
      if (event.key === 'Escape') {
        closeMenu();
      } else if (event.key === 'Tab') {
        Utils.trapFocus(navMenu, event);
      }
    }
  });

  // 5. Sticky Header elevation on scroll
  const handleScrollHeader = Utils.throttle(() => {
    if (window.scrollY > 20) {
      header?.classList.add('header--scrolled');
    } else {
      header?.classList.remove('header--scrolled');
    }
  }, 100);

  window.addEventListener('scroll', handleScrollHeader, { passive: true });

  // 6. Active Link Highlighting using IntersectionObserver (ScrollSpy)
  const sections = Utils.qsa('section[id]');
  
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Highlights as section passes upper-middle viewport
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((sec) => sectionObserver.observe(sec));
  }
});
