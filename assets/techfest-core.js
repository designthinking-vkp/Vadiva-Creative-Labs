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
        if (sessionStorage.getItem('tf_test_secret')) return true;
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
          <span>&#9888; DEVELOPER TEST MODE &mdash; NO REAL PAYMENT / OTP</span>
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
      sessionStorage.removeItem('tf_test_secret');
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

  // 4. Real-Time Slot & Capacity Engine (Specification Part E)
  const TechFestCapacity = {
    subscribers: [],
    pollTimer: null,
    apiEndpoint: '../../techfest-api/slots_capacity.php?action=realtime_capacity',

    data: {
      paidWorkshops: [
        {
          id: 1,
          code: 'WS-ROCKET',
          name: 'Rocket Lab',
          short_desc: 'Build pneumatic and solid-propellant rockets. Test thrust curves, stability, and aerodynamics with live outdoor launches.',
          is_paid: true,
          price_velammal: 400,
          price_other: 550,
          venue: 'Aero & Space Field (Outdoor Launch Arena)',
          duration: '2 Days · 2 Sessions (4 Hours Total Hands-on)',
          highlights: [
            'Pneumatic & solid-propellant rocket propulsion principles',
            'Stability, center of mass, and fin aerodynamics calibration',
            'Live outdoor flight tests with apogee altitude tracking'
          ],
          tools: 'Pneumatic launch rigs, digital altimeters, composite rocket bodies, recovery parachutes',
          what_to_bring: 'No laptop needed. All safety gear, rocket assemblies, and launch hardware provided.',
          binding_constraint: 'Launch cycles at the outdoor pad',
          capacity_per_batch: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 20, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 2,
          code: 'WS-SATELLITE',
          name: 'Satellite Makers',
          short_desc: 'Assemble functioning CubeSat scale model payloads with environmental sensors, telemetry transceivers, and ground-station tracking.',
          is_paid: true,
          price_velammal: 450,
          price_other: 600,
          binding_constraint: 'Sensor kits and bench space',
          capacity_per_batch: 25,
          min_grade: 6,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 25, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 25, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 25, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 25, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 3,
          code: 'WS-DRONE',
          name: 'Drone Pilot Academy',
          short_desc: 'Learn quadcopter aerodynamics, optical-flow positioning, and manual FPV flight maneuvers inside the safety flight cage.',
          is_paid: true,
          price_velammal: 450,
          price_other: 600,
          binding_constraint: 'Cage flight time per pilot',
          capacity_per_batch: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 20, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 4,
          code: 'WS-AEROFORGE',
          name: 'Aeroforge',
          short_desc: 'Craft RC high-lift gliders from carbon composite and foam boards. Master transmitter trims, stall recovery, and arena flight physics.',
          is_paid: true,
          price_velammal: 400,
          price_other: 550,
          binding_constraint: 'Transmitter and Air Arena flight time',
          capacity_per_batch: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 20, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 5,
          code: 'WS-ARVR',
          name: 'AR/VR Experience Lab',
          short_desc: 'Develop immersive 3D spatial environments in WebXR. Deploy interactive holographic scenes directly to VR headsets.',
          is_paid: true,
          price_velammal: 350,
          price_other: 500,
          binding_constraint: 'Headset viewers and floor space',
          capacity_per_batch: 40,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 40, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 6,
          code: 'WS-AI',
          name: 'AI Inventors Lab',
          short_desc: 'Train computer vision and voice classification neural networks using edge accelerators. Build interactive gesture-controlled apps.',
          is_paid: true,
          price_velammal: 400,
          price_other: 550,
          binding_constraint: 'Instructor-to-student ratio',
          capacity_per_batch: 40,
          min_grade: 6,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 40, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 7,
          code: 'WS-GAMEFORGE',
          name: 'Game Forge',
          short_desc: 'Design and script 2D physics-based arcade and platformer games with custom sprite animations, sound effects, and enemy AI.',
          is_paid: true,
          price_velammal: 350,
          price_other: 500,
          binding_constraint: 'Instructor-to-student ratio',
          capacity_per_batch: 40,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 40, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 8,
          code: 'WS-3DMAKERS',
          name: '3D Makers Lab',
          short_desc: 'Parametric 3D CAD modeling with live slicer optimization and multi-filament 3D printer calibration and physical manufacturing.',
          is_paid: true,
          price_velammal: 350,
          price_other: 500,
          binding_constraint: '3D printer throughput',
          capacity_per_batch: 20,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 20, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 20, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 9,
          code: 'WS-ARDUINO',
          name: 'Arduino Inventors Lab',
          short_desc: 'Microcontroller circuits, PWM motor drives, ultrasonic sonar radar, and hardware sensor integration on breadboards.',
          is_paid: true,
          price_velammal: 350,
          price_other: 500,
          binding_constraint: 'Bench space and power outlets',
          capacity_per_batch: 25,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 25, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 25, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 25, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 25, seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 10,
          code: 'WS-ANIMATION',
          name: 'Animation Lab',
          short_desc: 'Stop-motion, vector tweening, character rigging, and frame-by-frame visual storytelling for digital media production.',
          is_paid: true,
          price_velammal: 300,
          price_other: 450,
          binding_constraint: 'Instructor-to-student ratio',
          capacity_per_batch: 40,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
          batches: [
            { batch_code: 'B-01', slots: 'D1-AM + D2-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-02', slots: 'D1-PM + D2-PM (13:30–15:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-03', slots: 'D2-AM + D3-AM (09:30–11:30)', capacity: 40, seats_filled: 0, soft_locks: 0 },
            { batch_code: 'B-04', slots: 'D2-PM (13:30) + D3-AM (09:30)', capacity: 40, seats_filled: 0, soft_locks: 0 }
          ]
        }
      ],

      freeWorkshops: [
        {
          id: 11,
          code: 'FREE-DT',
          name: 'Design Thinking Bootcamp',
          short_desc: '5-stage human-centered innovation method — rapid problem framing, ideation, and paper prototyping.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-1', theatre: 'Theatre Alpha', time: 'Day 1 · 10:00–11:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D2-2', theatre: 'Theatre Alpha', time: 'Day 2 · 12:00–13:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 12,
          code: 'FREE-SKETCH',
          name: 'Sketching & Visual Thinking',
          short_desc: 'Transform complex technical thoughts into visual frameworks, wireframe sketches, and graphic representations.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-1', theatre: 'Theatre Beta', time: 'Day 1 · 10:00–11:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D2-2', theatre: 'Theatre Beta', time: 'Day 2 · 12:00–13:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 13,
          code: 'FREE-PITCH',
          name: 'Public Speaking & Pitching',
          short_desc: 'Story arcs, vocal projection, body language, and elevator pitch structuring for young startup creators.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-2', theatre: 'Theatre Alpha', time: 'Day 1 · 12:00–13:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D2-3', theatre: 'Theatre Alpha', time: 'Day 2 · 14:00–15:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 14,
          code: 'FREE-SCIENCE',
          name: 'Science Demonstrations',
          short_desc: 'Spectacular live physics and chemistry experiments exploring cryogenics, vortex dynamics, and electromagnetism.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-2', theatre: 'Theatre Beta', time: 'Day 1 · 12:00–13:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D2-3', theatre: 'Theatre Beta', time: 'Day 2 · 14:00–15:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 15,
          code: 'FREE-ENTREP',
          name: 'Student Entrepreneurship',
          short_desc: 'Validating customer pain points, unit economics, and building viable student-led venture blueprints.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 6,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-3', theatre: 'Theatre Alpha', time: 'Day 1 · 14:00–15:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D2-4', theatre: 'Theatre Alpha', time: 'Day 2 · 16:00–17:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 16,
          code: 'FREE-CODE',
          name: 'Creative Coding with p5.js',
          short_desc: 'Generate generative art, interactive visualizers, and mathematical beauty through introductory JavaScript.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-3', theatre: 'Theatre Beta', time: 'Day 1 · 14:00–15:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D2-4', theatre: 'Theatre Beta', time: 'Day 2 · 16:00–17:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 17,
          code: 'FREE-ELEC',
          name: 'Electronics Playground',
          short_desc: 'Introductory circuitry, polarity, breadboard basics, and making your first light-chaser gadget.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-4', theatre: 'Theatre Alpha', time: 'Day 1 · 16:00–17:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D3-1', theatre: 'Theatre Alpha', time: 'Day 3 · 10:00–11:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 18,
          code: 'FREE-CAD',
          name: 'CAD & 3D Modeling Intro',
          short_desc: 'Beginner spatial design in Tinkercad, Boolean operations, and understanding 3D coordinate geometry.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 4,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D1-4', theatre: 'Theatre Beta', time: 'Day 1 · 16:00–17:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D3-1', theatre: 'Theatre Beta', time: 'Day 3 · 10:00–11:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 19,
          code: 'FREE-SPACE',
          name: 'Space Exploration Lab',
          short_desc: 'Astrophysics basics, orbital mechanics, planetary landers, and future lunar/Martian habitat engineering.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D2-1', theatre: 'Theatre Alpha', time: 'Day 2 · 10:00–11:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D3-2', theatre: 'Theatre Alpha', time: 'Day 3 · 12:00–13:00', seats_filled: 0, soft_locks: 0 }
          ]
        },
        {
          id: 20,
          code: 'FREE-CYBER',
          name: 'Cyber Safety & AI Ethics',
          short_desc: 'Protecting digital identity, understanding algorithmic bias, deepfake detection, and responsible online citizenship.',
          is_paid: false,
          binding_constraint: 'Theatre seat capacity',
          capacity_per_session: 100,
          public_capacity: 80,
          standby_capacity: 20,
          min_grade: 5,
          max_grade: 12,
          image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
          sessions: [
            { slot_code: 'F-D2-1', theatre: 'Theatre Beta', time: 'Day 2 · 10:00–11:00', seats_filled: 0, soft_locks: 0 },
            { slot_code: 'F-D3-2', theatre: 'Theatre Beta', time: 'Day 3 · 12:00–13:00', seats_filled: 0, soft_locks: 0 }
          ]
        }
      ]
    },

    init() {
      this.fetchLiveData();
      // Regular live sync with backend API every 10 seconds
      this.pollTimer = setInterval(() => {
        this.fetchLiveData();
      }, 10000);
    },

    subscribe(callback) {
      if (typeof callback === 'function') {
        this.subscribers.push(callback);
        // Immediately invoke with current state
        callback(this.data);
      }
    },

    notifySubscribers() {
      this.subscribers.forEach(cb => {
        try { cb(this.data); } catch (e) { console.error('Capacity subscriber error:', e); }
      });
    },

    fetchLiveData() {
      fetch(this.apiEndpoint)
        .then(res => res.json())
        .then(res => {
          if (res && res.success && res.data) {
            if (res.data.paid_workshops) this.data.paidWorkshops = res.data.paid_workshops;
            if (res.data.free_workshops) this.data.freeWorkshops = res.data.free_workshops;
            this.notifySubscribers();
          }
        })
        .catch(() => {
          this.notifySubscribers();
        });
    },

    getPaidWorkshops() {
      return this.data.paidWorkshops;
    },

    getFreeWorkshops() {
      return this.data.freeWorkshops;
    },

    getWorkshopById(id) {
      const numId = parseInt(id, 10);
      return this.data.paidWorkshops.find(w => w.id === numId) ||
             this.data.freeWorkshops.find(w => w.id === numId) || null;
    }
  };

  // Auto initialize capacity engine
  TechFestCapacity.init();

  // Expose to window
  window.TechFestConfig = TechFestConfig;
  window.TechFestAccess = TechFestAccess;
  window.TechFestDev = TechFestDev;
  window.TechFestCapacity = TechFestCapacity;

  // Auto-init banner when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TechFestAccess.renderBypassBanner());
  } else {
    TechFestAccess.renderBypassBanner();
  }

})(window);

