/**
 * DecodeLabs Project 1 - Utility Functions
 *
 * Provides reusable helper functions for event debouncing,
 * email validation, safe DOM manipulation, and keyboard accessibility.
 */

'use strict';

/**
 * Utility namespace to encapsulate helper methods without polluting global scope.
 */
const Utils = {
  /**
   * Debounce execution of a function by a specified wait time in milliseconds.
   * Useful for high-frequency events like window resize or scroll.
   *
   * @param {Function} func - The callback function to execute.
   * @param {number} wait - Delay in milliseconds.
   * @returns {Function} - The debounced function wrapper.
   */
  debounce(func, wait = 100) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  },

  /**
   * Throttle execution of a function to at most once per specified limit.
   *
   * @param {Function} func - The callback function to execute.
   * @param {number} limit - Time window in milliseconds.
   * @returns {Function} - The throttled function wrapper.
   */
  throttle(func, limit = 100) {
    let inThrottle = false;
    return function throttled(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  /**
   * Validates an email address against standard RFC 5322 compatible regex.
   * Checks for standard localpart@domain.tld formatting.
   *
   * @param {string} email - The input email string to test.
   * @returns {boolean} - True if valid, false otherwise.
   */
  isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    // Standard robust email regex conforming to WCAG and HTML5 input requirements
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(trimmed);
  },

  /**
   * Sanitizes a string by escaping HTML entities to prevent XSS.
   *
   * @param {string} str - Raw user input string.
   * @returns {string} - Sanitized string safe for rendering.
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Safe document query selector helper with error boundary.
   *
   * @param {string} selector - CSS selector string.
   * @param {Element|Document} [scope=document] - Search scope.
   * @returns {Element|null} - Selected element or null.
   */
  qs(selector, scope = document) {
    try {
      return scope.querySelector(selector);
    } catch (err) {
      console.warn(`[Utils.qs] Invalid selector: "${selector}"`, err);
      return null;
    }
  },

  /**
   * Safe document query selector all helper returning standard Array.
   *
   * @param {string} selector - CSS selector string.
   * @param {Element|Document} [scope=document] - Search scope.
   * @returns {Element[]} - Array of matching elements.
   */
  qsa(selector, scope = document) {
    try {
      return Array.from(scope.querySelectorAll(selector));
    } catch (err) {
      console.warn(`[Utils.qsa] Invalid selector: "${selector}"`, err);
      return [];
    }
  },

  /**
   * Traps focus inside a container element for accessible modal/drawer dialogs.
   *
   * @param {HTMLElement} container - The container element to trap focus inside.
   * @param {KeyboardEvent} event - The keyboard event (keydown).
   */
  trapFocus(container, event) {
    if (!container || event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement) return;

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }
};
