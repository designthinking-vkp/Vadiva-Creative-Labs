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
      userId: 'tf_user_id',
      participantId: 'tf_participant_id',
      token: 'tf_token',
      userName: 'tf_user_name',
      userMobile: 'tf_user_mobile',
      userEmail: 'tf_user_email',
      grade: 'tf_grade',
      band: 'tf_band',
      tier: 'tf_tier',
      isVelammal: 'tf_is_velammal',
      velammalVerified: 'tf_velammal_verified',
      campusName: 'tf_campus_name',
      admissionNumber: 'tf_admission_number',
      entryPaid: 'tf_entry_paid',
      pendingWorkshop: 'tf_pending_workshop',
      pendingBatch: 'tf_pending_batch',
      postLoginRedirect: 'tf_post_login_redirect'
    }
  };

  // 2. Band Derivation from Grade (Grades 4-12)
  function deriveBandFromGrade(grade) {
    const g = parseInt(grade, 10);
    if (g >= 4 && g <= 6) return 'JUNIOR';
    if (g >= 7 && g <= 9) return 'INTERMEDIATE';
    if (g >= 10 && g <= 12) return 'SENIOR';
    return null;
  }

  // 3. Centralized Access Control Layer
  const TechFestAccess = {
    isBypassMode() {
      return false;
    },

    deriveBandFromGrade,

    checkAccess(requirement, context = {}) {
      return {
        allowed: this.normalAccessValidation(requirement, context),
        mode: 'production',
        reason: 'Standard validation',
        user: this.getCurrentUser(),
        payment: this.getPaymentState()
      };
    },

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

    isAuthenticated() {
      try {
        return Boolean(localStorage.getItem(TechFestConfig.storageKeys.participantId) || localStorage.getItem(TechFestConfig.storageKeys.token));
      } catch (e) {
        return false;
      }
    },

    hasCompletedEntryPayment(participantId) {
      try {
        return localStorage.getItem(TechFestConfig.storageKeys.entryPaid) === 'true';
      } catch (e) {
        return false;
      }
    },

    getCurrentUser() {
      try {
        const pid = localStorage.getItem(TechFestConfig.storageKeys.participantId);
        if (!pid) return null;
        return {
          id: pid,
          userId: localStorage.getItem(TechFestConfig.storageKeys.userId) || pid,
          name: localStorage.getItem(TechFestConfig.storageKeys.userName) || pid,
          mobile: localStorage.getItem(TechFestConfig.storageKeys.userMobile) || '',
          email: localStorage.getItem(TechFestConfig.storageKeys.userEmail) || '',
          grade: localStorage.getItem(TechFestConfig.storageKeys.grade) || '',
          band: localStorage.getItem(TechFestConfig.storageKeys.band) || 'JUNIOR',
          tier: localStorage.getItem(TechFestConfig.storageKeys.tier) || 'OTHER',
          isVelammalVerified: localStorage.getItem(TechFestConfig.storageKeys.velammalVerified) === 'true',
          campusName: localStorage.getItem(TechFestConfig.storageKeys.campusName) || '',
          admissionNumber: localStorage.getItem(TechFestConfig.storageKeys.admissionNumber) || '',
          entryPaid: localStorage.getItem(TechFestConfig.storageKeys.entryPaid) === 'true',
          role: 'participant',
          isBypassUser: false
        };
      } catch (e) {
        return null;
      }
    },

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

    getPendingWorkshop() {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get('workshop') || sessionStorage.getItem(TechFestConfig.storageKeys.pendingWorkshop) || '';
      } catch (e) {
        return '';
      }
    },

    setPendingWorkshop(workshopId, batchCode = 'B-01') {
      if (!workshopId) return;
      try {
        sessionStorage.setItem(TechFestConfig.storageKeys.pendingWorkshop, String(workshopId).trim());
        if (batchCode) sessionStorage.setItem(TechFestConfig.storageKeys.pendingBatch, String(batchCode).trim());
        sessionStorage.setItem(TechFestConfig.storageKeys.postLoginRedirect, '../register/index.html?workshop=' + encodeURIComponent(workshopId) + '&batch=' + encodeURIComponent(batchCode));
      } catch (e) {}
    },

    clearPendingWorkshop() {
      try {
        sessionStorage.removeItem(TechFestConfig.storageKeys.pendingWorkshop);
        sessionStorage.removeItem(TechFestConfig.storageKeys.pendingBatch);
        sessionStorage.removeItem(TechFestConfig.storageKeys.postLoginRedirect);
      } catch (e) {}
    },

    logout(redirectTo = '../login/index.html') {
      try {
        localStorage.removeItem(TechFestConfig.storageKeys.userId);
        localStorage.removeItem(TechFestConfig.storageKeys.participantId);
        localStorage.removeItem(TechFestConfig.storageKeys.token);
        localStorage.removeItem(TechFestConfig.storageKeys.userName);
        localStorage.removeItem(TechFestConfig.storageKeys.userMobile);
        localStorage.removeItem(TechFestConfig.storageKeys.userEmail);
        localStorage.removeItem(TechFestConfig.storageKeys.grade);
        localStorage.removeItem(TechFestConfig.storageKeys.band);
        localStorage.removeItem(TechFestConfig.storageKeys.tier);
        localStorage.removeItem(TechFestConfig.storageKeys.isVelammal);
        localStorage.removeItem(TechFestConfig.storageKeys.velammalVerified);
        localStorage.removeItem(TechFestConfig.storageKeys.campusName);
        localStorage.removeItem(TechFestConfig.storageKeys.admissionNumber);
        localStorage.removeItem(TechFestConfig.storageKeys.entryPaid);

        sessionStorage.clear();
      } catch (e) {
        console.warn('Storage clear during logout:', e);
      }

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  };

  // Expose to window
  window.TechFestConfig = TechFestConfig;
  window.TechFestAccess = TechFestAccess;

})(window);
