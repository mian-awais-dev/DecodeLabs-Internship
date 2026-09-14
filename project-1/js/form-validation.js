/**
 * DecodeLabs Project 1 - Form Validation Controller
 *
 * Implements accessible, client-side validation for the contact form.
 * Provides real-time field validation, error message association via ARIA,
 * simulated network dispatch, and form reset.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = Utils.qs('#contact-form');
  const successBanner = Utils.qs('#form-success-banner');
  const submitBtn = Utils.qs('#form-submit-btn');

  if (!form) {
    return;
  }

  // Input references
  const fields = {
    name: {
      input: Utils.qs('#contact-name', form),
      group: Utils.qs('#group-name', form),
      errorSpan: Utils.qs('#error-name', form),
      validate: (val) => val.trim().length >= 2,
      errorMsg: 'Please enter your full name (at least 2 characters).'
    },
    email: {
      input: Utils.qs('#contact-email', form),
      group: Utils.qs('#group-email', form),
      errorSpan: Utils.qs('#error-email', form),
      validate: (val) => Utils.isValidEmail(val),
      errorMsg: 'Please enter a valid email address (e.g., name@domain.com).'
    },
    subject: {
      input: Utils.qs('#contact-subject', form),
      group: Utils.qs('#group-subject', form),
      errorSpan: Utils.qs('#error-subject', form),
      validate: (val) => val.trim().length >= 3,
      errorMsg: 'Please enter a project topic (at least 3 characters).'
    },
    message: {
      input: Utils.qs('#contact-message', form),
      group: Utils.qs('#group-message', form),
      errorSpan: Utils.qs('#error-message', form),
      validate: (val) => val.trim().length >= 10,
      errorMsg: 'Please provide detailed project notes (at least 10 characters).'
    }
  };

  /**
   * Sets the visual and accessible error state for a form field.
   *
   * @param {Object} fieldConfig - The field configuration object.
   */
  function showError(fieldConfig) {
    if (!fieldConfig.input || !fieldConfig.group) return;
    fieldConfig.group.classList.add('has-error');
    fieldConfig.input.setAttribute('aria-invalid', 'true');
  }

  /**
   * Clears the error state for a form field.
   *
   * @param {Object} fieldConfig - The field configuration object.
   */
  function clearError(fieldConfig) {
    if (!fieldConfig.input || !fieldConfig.group) return;
    fieldConfig.group.classList.remove('has-error');
    fieldConfig.input.setAttribute('aria-invalid', 'false');
  }

  /**
   * Validates an individual field.
   *
   * @param {Object} fieldConfig - The field configuration object.
   * @returns {boolean} - True if valid, false otherwise.
   */
  function validateField(fieldConfig) {
    if (!fieldConfig.input) return true;
    const value = fieldConfig.input.value;
    const isValid = fieldConfig.validate(value);

    if (!isValid) {
      showError(fieldConfig);
      return false;
    } else {
      clearError(fieldConfig);
      return true;
    }
  }

  // Attach live blur and input events for instant user feedback
  Object.values(fields).forEach((fieldConfig) => {
    if (!fieldConfig.input) return;

    // Validate when user leaves the input (blur)
    fieldConfig.input.addEventListener('blur', () => {
      validateField(fieldConfig);
    });

    // Clear error dynamically as user types (input)
    fieldConfig.input.addEventListener('input', () => {
      if (fieldConfig.group.classList.contains('has-error')) {
        validateField(fieldConfig);
      }
    });
  });

  // Handle Form Submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let isFormValid = true;
    let firstInvalidField = null;

    // Validate all registered fields
    Object.values(fields).forEach((fieldConfig) => {
      const isValid = validateField(fieldConfig);
      if (!isValid) {
        isFormValid = false;
        if (!firstInvalidField) {
          firstInvalidField = fieldConfig.input;
        }
      }
    });

    // If validation fails, shift focus to the first errored element for accessibility
    if (!isFormValid) {
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
      return;
    }

    // Form is valid: Simulate async submission with loading state
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    }

    // Simulated network latency (600ms)
    setTimeout(() => {
      // Restore submit button
      if (submitBtn) {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }

      // Display accessible success banner
      if (successBanner) {
        successBanner.classList.remove('is-hidden');
        successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Reset form controls
      form.reset();

      // Reset aria attributes
      Object.values(fields).forEach((f) => clearError(f));

      // Auto-hide success notification after 7 seconds
      setTimeout(() => {
        if (successBanner) {
          successBanner.classList.add('is-hidden');
        }
      }, 7000);
    }, 600);
  });
});
