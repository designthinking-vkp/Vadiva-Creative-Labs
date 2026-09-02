/**
 * Tech Fest Core - Production Access Control & Utilities
 * Vadiva Creative Labs - Tech & Design Fest '26
 */
(function(window) {
  'use strict';

  // 1. Centralized Configuration
  const TechFestConfig = {
    bypassMode: false,

    // Storage Keys
    storageKeys: {
      participantId: 'tf_participant_id',
      token: 'tf_token',
      userName: 'tf_user_name',
      userMobile: 'tf_user_mobile',
      userEmail: 'tf_user_email',
      entryPaid: 'tf_entry_paid',
      pendingWorkshop: 'tf_pending_workshop',
      postLoginRedirect: 'tf_post_login_redirect'
    }
  };

  // 2. Centralized Access Control Layer
  const TechFestAccess = {
    /**
     * Testing mode is completely disabled
     */
    isBypassMode() {
      return false;
    },

    /**
     * Centralized route and action guard
     * @param {string} requirement - 'authentication' | 'registration' | 'payment' | 'workshop' | 'dashboard' | 'admin' | 'coordinator'
     * @param {Object} context - Optional context parameters
     */
    checkAccess(requirement, context = {}) {
      return {
        allowed: this.normalAccessValidation(requirement, context),
        mode: 'production',
        reason: 'Standard validation',
        user: this.getCurrentUser(),
        payment: this.getPaymentState()
      };
    },

    /**
     * Normal validation logic
     */
    normalAccessValidation(requirement, context = {}) {
      switch (requirement) {
        case 'authentication':
        case 'dashboard':
        case 'admin':
        case 'coordinator':
          return Boolean(localStorage.getItem(TechFestConfig.storageKeys.participantId) || localStorage.getItem(TechFestConfig.storageKeys.token));
        case 'payment':
          return localStorage.getItem(TechFestConfig.storageKeys.entryPaid) === 'true';
        case 'registration':
        case 'workshop':
        default:
          return true;
      }
    },

    /**
     * Returns true if user is authenticated
     */
    isAuthenticated() {
      try {
        return Boolean(localStorage.getItem(TechFestConfig.storageKeys.participantId) || localStorage.getItem(TechFestConfig.storageKeys.token));
      } catch (e) {
        return false;
      }
    },

    /**
     * Returns true if entry fee / payment requirement is satisfied
     */
    hasCompletedPayment(participantId) {
      try {
        return localStorage.getItem(TechFestConfig.storageKeys.entryPaid) === 'true';
      } catch (e) {
        return false;
      }
    },

    /**
     * Returns current user identity object
     */
    getCurrentUser() {
      try {
        const pid = localStorage.getItem(TechFestConfig.storageKeys.participantId);
        if (!pid) return null;
        return {
          id: pid,
          name: localStorage.getItem(TechFestConfig.storageKeys.userName) || pid,
          mobile: localStorage.getItem(TechFestConfig.storageKeys.userMobile) || '',
          email: localStorage.getItem(TechFestConfig.storageKeys.userEmail) || '',
          role: 'participant',
          isBypassUser: false
        };
      } catch (e) {
        return null;
      }
    },

    /**
     * Returns current payment state
     */
    getPaymentState() {
      try {
        const isPaid = localStorage.getItem(TechFestConfig.storageKeys.entryPaid) === 'true';
        return {
          status: isPaid ? 'paid' : 'unpaid',
          isBypassPayment: false
        };
      } catch (e) {
        return { status: 'unpaid', isBypassPayment: false };
      }
    },

    /**
     * Helper to get pending workshop context
     */
    getPendingWorkshop() {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get('workshop') || sessionStorage.getItem(TechFestConfig.storageKeys.pendingWorkshop) || '';
      } catch (e) {
        return '';
      }
    },

    /**
     * Helper to persist pending workshop context
     */
    setPendingWorkshop(workshopId) {
      if (!workshopId) return;
      try {
        sessionStorage.setItem(TechFestConfig.storageKeys.pendingWorkshop, String(workshopId).trim());
        sessionStorage.setItem(TechFestConfig.storageKeys.postLoginRedirect, '../register/index.html?workshop=' + encodeURIComponent(workshopId));
      } catch (e) {}
    },

    /**
     * Helper to clear pending workshop context after completion
     */
    clearPendingWorkshop() {
      try {
        sessionStorage.removeItem(TechFestConfig.storageKeys.pendingWorkshop);
        sessionStorage.removeItem(TechFestConfig.storageKeys.postLoginRedirect);
      } catch (e) {}
    },

    /**
     * Universal robust logout handler
     * @param {string} redirectTo - Destination URL after logout
     */
    logout(redirectTo = '../login/index.html') {
      try {
        localStorage.removeItem(TechFestConfig.storageKeys.participantId);
        localStorage.removeItem(TechFestConfig.storageKeys.token);
        localStorage.removeItem(TechFestConfig.storageKeys.userName);
        localStorage.removeItem(TechFestConfig.storageKeys.userMobile);
        localStorage.removeItem(TechFestConfig.storageKeys.userEmail);
        localStorage.removeItem(TechFestConfig.storageKeys.entryPaid);
        localStorage.removeItem('tf_dev_bypass_active');
        localStorage.removeItem('tf_test_registration_data');
        localStorage.removeItem('tf_test_payment_data');

        sessionStorage.removeItem(TechFestConfig.storageKeys.pendingWorkshop);
        sessionStorage.removeItem(TechFestConfig.storageKeys.postLoginRedirect);
        sessionStorage.removeItem('tf_test_secret');
        sessionStorage.clear();
      } catch (e) {
        console.warn('Storage clear during logout had warning:', e);
      }

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    },

    renderBypassBanner() {
      // Production: No test banners
    }
  };

  // Expose to window
  window.TechFestConfig = TechFestConfig;
  window.TechFestAccess = TechFestAccess;

})(window);
