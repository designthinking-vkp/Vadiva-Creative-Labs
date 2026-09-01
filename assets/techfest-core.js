/**
 * Tech Fest Core - Centralized Configuration & Developer Bypass Access Control
 * Vadiva Creative Labs - Tech & Design Fest '26
 *
 * CRITICAL SAFETY RULES:
 * 1. bypassMode defaults to FALSE in code.
 * 2. Bypass mode is strictly for local developer/QA testing and never alters real financial records.
 * 3. All simulated transactions and users use unmistakable test markers (BYPASS-TEST-*, .invalid email).
 */
(function(window) {
  'use strict';

  // 1. Centralized Configuration
  const TechFestConfig = {
    // Production default: MUST be false
    bypassMode: false,

    // Simulated Developer Test User
    bypassUser: {
      id: 'TF-DEV-BYPASS-001',
      name: 'Tech Fest Developer',
      email: 'developer-test@example.invalid',
      mobile: '9876543210',
      role: 'developer',
      isBypassUser: true
    },

    // Simulated Developer Test Payment
    bypassPayment: {
      status: 'paid',
      transactionId: 'BYPASS-TEST-ORDER-2026',
      gateway: 'developer_simulation',
      amount: 250,
      currency: 'INR',
      isBypassPayment: true,
      settledAt: new Date().toISOString()
    },

    // Local/Session Storage Keys
    storageKeys: {
      bypassFlag: 'tf_dev_bypass_active',
      participantId: 'tf_participant_id',
      token: 'tf_token',
      userName: 'tf_user_name',
      entryPaid: 'tf_entry_paid',
      pendingWorkshop: 'tf_pending_workshop',
      postLoginRedirect: 'tf_post_login_redirect',
      testRegistration: 'tf_test_registration_data',
      testPayment: 'tf_test_payment_data'
    }
  };

  // 2. Centralized Access Control Layer
  const TechFestAccess = {
    /**
     * Checks whether Bypass Mode is active (via code configuration or dev flag)
     */
    isBypassMode() {
      if (TechFestConfig.bypassMode === true) return true;
      try {
        return localStorage.getItem(TechFestConfig.storageKeys.bypassFlag) === 'true';
      } catch (e) {
        return false;
      }
    },

    /**
     * Centralized route and action guard
     * @param {string} requirement - 'authentication' | 'registration' | 'payment' | 'workshop' | 'dashboard' | 'admin' | 'coordinator'
     * @param {Object} context - Optional context parameters
     */
    checkAccess(requirement, context = {}) {
      if (this.isBypassMode()) {
        this.logBypass(requirement, context);
        return {
          allowed: true,
          mode: 'developer-bypass',
          reason: 'Developer Bypass Mode active',
          user: this.getCurrentUser(),
          payment: this.getPaymentState()
        };
      }

      return {
        allowed: this.normalAccessValidation(requirement, context),
        mode: 'normal',
        reason: 'Standard validation',
        user: this.getCurrentUser(),
        payment: this.getPaymentState()
      };
    },

    /**
     * Normal validation logic when bypass is disabled
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
     * Returns true if user is authenticated (or if bypass mode is active)
     */
    isAuthenticated() {
      if (this.isBypassMode()) return true;
      try {
        return Boolean(localStorage.getItem(TechFestConfig.storageKeys.participantId) || localStorage.getItem(TechFestConfig.storageKeys.token));
      } catch (e) {
        return false;
      }
    },

    /**
     * Returns true if entry fee / payment requirement is satisfied (or bypassed)
     */
    hasCompletedPayment(participantId) {
      if (this.isBypassMode()) return true;
      try {
        return localStorage.getItem(TechFestConfig.storageKeys.entryPaid) === 'true';
      } catch (e) {
        return false;
      }
    },

    /**
     * Returns current user identity object (simulated dev user or authenticated participant)
     */
    getCurrentUser() {
      if (this.isBypassMode()) {
        return { ...TechFestConfig.bypassUser };
      }
      try {
        const pid = localStorage.getItem(TechFestConfig.storageKeys.participantId);
        if (!pid) return null;
        return {
          id: pid,
          name: localStorage.getItem(TechFestConfig.storageKeys.userName) || pid,
          role: 'participant',
          isBypassUser: false
        };
      } catch (e) {
        return null;
      }
    },

    /**
     * Returns current payment state (simulated test payment or real status)
     */
    getPaymentState() {
      if (this.isBypassMode()) {
        return {
          ...TechFestConfig.bypassPayment,
          transactionId: 'BYPASS-TEST-' + Date.now()
        };
      }
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
     * Clean console logger for bypass operations
     */
    logBypass(requirement, context = {}) {
      if (typeof console !== 'undefined' && console.info) {
        console.info(
          `%c[TechFest Bypass]%c ${requirement.toUpperCase()} bypassed (Developer Mode active)`,
          'background:#f59e0b;color:#000;font-weight:bold;padding:2px 6px;border-radius:4px;',
          'color:#d97706;font-weight:bold;'
        );
      }
    },

    /**
     * Universal robust logout handler
     * Clears all auth sessions, tokens, test bypass flags, and redirects
     * @param {string} redirectTo - Destination URL after logout
     */
    logout(redirectTo = '../login/index.html') {
      try {
        // Clear all auth & session keys
        localStorage.removeItem(TechFestConfig.storageKeys.participantId);
        localStorage.removeItem(TechFestConfig.storageKeys.token);
        localStorage.removeItem(TechFestConfig.storageKeys.userName);
        localStorage.removeItem(TechFestConfig.storageKeys.entryPaid);
        localStorage.removeItem(TechFestConfig.storageKeys.bypassFlag);
        localStorage.removeItem(TechFestConfig.storageKeys.testRegistration);
        localStorage.removeItem(TechFestConfig.storageKeys.testPayment);

        sessionStorage.removeItem(TechFestConfig.storageKeys.pendingWorkshop);
        sessionStorage.removeItem(TechFestConfig.storageKeys.postLoginRedirect);

        // Clear all session storage
        sessionStorage.clear();
      } catch (e) {
        console.warn('Storage clear during logout had warning:', e);
      }

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    },

    /**
     * Injects developer banner when bypass mode is active
     */
    renderBypassBanner() {
      if (!this.isBypassMode()) return;
      if (document.getElementById('tf-dev-bypass-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'tf-dev-bypass-banner';
      banner.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
        background: linear-gradient(90deg, #b45309, #d97706);
        color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px; font-weight: 700; padding: 6px 16px;
        display: flex; align-items: center; justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25); box-sizing: border-box;
      `;

      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>&#9888; DEVELOPER BYPASS MODE</span>
          <span style="opacity:0.85; font-weight:400; font-size:11px;">| Auth &amp; Payment Simulated | Identity: TF-DEV-BYPASS-001</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" onclick="TechFestDev.resetSession()" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Reset State</button>
          <button type="button" onclick="TechFestDev.disableBypass()" style="background:#ffffff; border:none; color:#b45309; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; cursor:pointer;">Disable Bypass</button>
        </div>
      `;

      if (document.body) {
        document.body.appendChild(banner);
        document.body.style.paddingTop = (parseInt(window.getComputedStyle(document.body).paddingTop, 10) || 0) + 32 + 'px';
      }
    }
  };

  // 3. Developer Console Helpers
  const TechFestDev = {
    enableBypass() {
      localStorage.setItem(TechFestConfig.storageKeys.bypassFlag, 'true');
      localStorage.setItem(TechFestConfig.storageKeys.participantId, TechFestConfig.bypassUser.id);
      localStorage.setItem(TechFestConfig.storageKeys.token, 'dev-bypass-token-' + Date.now());
      console.info('%c[TechFest Dev] Developer Bypass Mode ENABLED. Reloading...', 'color: #10b981; font-weight: bold;');
      window.location.reload();
    },

    disableBypass() {
      localStorage.removeItem(TechFestConfig.storageKeys.bypassFlag);
      if (localStorage.getItem(TechFestConfig.storageKeys.participantId) === TechFestConfig.bypassUser.id) {
        localStorage.removeItem(TechFestConfig.storageKeys.participantId);
        localStorage.removeItem(TechFestConfig.storageKeys.token);
      }
      console.info('%c[TechFest Dev] Developer Bypass Mode DISABLED. Reloading...', 'color: #ef4444; font-weight: bold;');
      window.location.reload();
    },

    resetSession() {
      localStorage.removeItem(TechFestConfig.storageKeys.bypassFlag);
      localStorage.removeItem(TechFestConfig.storageKeys.participantId);
      localStorage.removeItem(TechFestConfig.storageKeys.token);
      localStorage.removeItem(TechFestConfig.storageKeys.userName);
      localStorage.removeItem(TechFestConfig.storageKeys.entryPaid);
      sessionStorage.removeItem(TechFestConfig.storageKeys.pendingWorkshop);
      sessionStorage.removeItem(TechFestConfig.storageKeys.postLoginRedirect);
      localStorage.removeItem(TechFestConfig.storageKeys.testRegistration);
      localStorage.removeItem(TechFestConfig.storageKeys.testPayment);
      console.info('%c[TechFest Dev] Test state reset. Reloading...', 'color: #3b82f6; font-weight: bold;');
      window.location.reload();
    },

    status() {
      const active = TechFestAccess.isBypassMode();
      console.group('%c[TechFest Access Status]', 'font-weight: bold; color: ' + (active ? '#d97706' : '#10b981'));
      console.log('Bypass Mode Active:', active);
      console.log('Config Defaults:', TechFestConfig);
      console.log('Current User:', TechFestAccess.getCurrentUser());
      console.log('Payment State:', TechFestAccess.getPaymentState());
      console.groupEnd();
      return { active, user: TechFestAccess.getCurrentUser() };
    }
  };

  // Expose to window
  window.TechFestConfig = TechFestConfig;
  window.TechFestAccess = TechFestAccess;
  window.TechFestDev = TechFestDev;

  // Auto-init banner when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TechFestAccess.renderBypassBanner());
  } else {
    TechFestAccess.renderBypassBanner();
  }

})(window);
