/**
 * DecodeLabs Project 1 - Main Application Orchestrator
 *
 * Coordinates initialization, smooth scrolling with header offsets,
 * metric number animations, collapsible sidebar handling, and performance logging.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  console.log(
    '%c DecodeLabs Project 1 %c Initialized with pure HTML5, CSS3 & Vanilla JavaScript ',
    'background: #A6856F; color: #FFFFFF; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    'background: #2C2C2C; color: #A0D4E0; padding: 4px 8px; border-radius: 4px;'
  );

  /* ==========================================================================
     1. Smooth Anchor Scrolling with Header Offset
     ========================================================================== */
  const anchorLinks = Utils.qsa('a[href^="#"]');
  const header = Utils.qs('#site-header');

  anchorLinks.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetElement = Utils.qs(targetId);
      if (targetElement) {
        event.preventDefault();

        // Calculate offset based on current header height
        const headerHeight = header ? header.offsetHeight : 72;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });

        // Update keyboard focus for accessibility without jumping
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
      }
    });
  });

  /* ==========================================================================
     2. Collapsible Mobile Sidebar Handler
     ========================================================================== */
  const sidebarToggleBtn = Utils.qs('#sidebar-toggle-btn');
  const sidebarContent = Utils.qs('#sidebar-content');

  if (sidebarToggleBtn && sidebarContent) {
    sidebarToggleBtn.addEventListener('click', () => {
      const isExpanded = sidebarToggleBtn.getAttribute('aria-expanded') === 'true';
      sidebarToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      
      if (isExpanded) {
        sidebarContent.style.display = 'none';
        sidebarToggleBtn.innerHTML = '<span>Show</span> <span aria-hidden="true">&#9656;</span>';
      } else {
        sidebarContent.style.display = 'flex';
        sidebarToggleBtn.innerHTML = '<span>Hide</span> <span aria-hidden="true">&#9662;</span>';
      }
    });

    // Reset inline display style on window resize across breakpoints
    window.addEventListener(
      'resize',
      Utils.debounce(() => {
        if (window.innerWidth >= 1024) {
          sidebarContent.style.display = 'flex';
          sidebarToggleBtn.setAttribute('aria-expanded', 'true');
        }
      }, 150)
    );
  }

  /* ==========================================================================
     3. Animated Stats Counters
     ========================================================================== */
  const statNumbers = Utils.qsa('.hero-stat-number[data-count]');

  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    let hasAnimated = false;

    const statsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            animateCounters();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = Utils.qs('.hero-stats');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }

    function animateCounters() {
      statNumbers.forEach((el) => {
        const rawTarget = el.getAttribute('data-count');
        const targetValue = parseFloat(rawTarget);
        if (isNaN(targetValue)) return;

        const duration = 1200; // 1.2s duration
        const startTime = performance.now();
        const originalText = el.textContent;
        const suffix = originalText.replace(/[0-9.]/g, '');

        function updateNumber(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic calculation
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentVal = targetValue * easeOut;

          // Format floating vs integer
          if (rawTarget.includes('.')) {
            el.textContent = currentVal.toFixed(1) + suffix;
          } else {
            el.textContent = Math.floor(currentVal) + suffix;
          }

          if (progress < 1) {
            requestAnimationFrame(updateNumber);
          } else {
            el.textContent = rawTarget + suffix;
          }
        }

        requestAnimationFrame(updateNumber);
      });
    }
  }

  /* ==========================================================================
     4. Performance & Core Web Vitals Monitoring Log
     ========================================================================== */
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        console.log(
          `%cPerformance:%c DOM Ready: ${domReadyTime}ms | Total Load: ${pageLoadTime}ms`,
          'color: #A6856F; font-weight: bold;',
          'color: #2C2C2C;'
        );
      }, 0);
    });
  }
});
