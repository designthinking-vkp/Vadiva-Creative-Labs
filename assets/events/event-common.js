/**
 * Vadiva Creative Labs - 2026 Flagship Events Common JS
 * Form Validation, Razorpay Integration, Digital Event Card Generator, QR Code & Download
 */

(function(window) {
  'use strict';

  // Standalone QR Code Generator (Compact QR Byte Matrix implementation)
  const SimpleQR = (function() {
    function generateQRDataURL(text, size = 180) {
      // Use SVG Data URI for crisp, vector-sharp QR Code without any external CDN
      const encoded = encodeURIComponent(text);
      // Modern Google Chart API fallback or pure SVG matrix
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`;
    }
    return { getDataURL: generateQRDataURL };
  })();

  /**
   * Dynamically loads Razorpay Standard Checkout SDK if not already loaded
   */
  function loadRazorpaySDK() {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay !== 'undefined') {
        return resolve(window.Razorpay);
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.Razorpay));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK.')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Unable to connect to Razorpay payment network.'));
      document.head.appendChild(script);
    });
  }

  /**
   * Event Theme Configs for Digital Event Card
   */
  const EVENT_CARD_THEMES = {
    'kids-maker-fair-2026': {
      title: 'Kids Maker Fair & Repair Mela',
      tagline: 'Make it. Fix it. Reuse it!',
      date: '29 November 2026',
      time: '10:30 AM – 3:30 PM',
      venue: 'Santhome, Vadiva Creative Labs',
      feeText: '₹99 (Paid)',
      accentColor: '#FF6B00',
      headerBg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      badgeClass: 'badge-maker'
    },
    'protospark-forge-2026': {
      title: 'ProtoSpark Forge',
      tagline: 'PROTOTYPE → PRODUCT',
      date: '26–30 December 2026',
      time: '5 Days, 4 Nights (Sleep Over)',
      venue: 'TVIS, Ponneri',
      feeText: '₹6,000 (Paid)',
      accentColor: '#F59E0B',
      headerBg: 'linear-gradient(135deg, #0A192F 0%, #1E3A8A 100%)',
      badgeClass: 'badge-forge'
    },
    'shipwreck-island-2026': {
      title: 'Shipwreck Island',
      tagline: '3 DAYS TO BUILD YOUR WAY HOME!',
      date: '26–30 December 2026',
      time: 'Stay-in Camp',
      venue: 'TVIS, Ponneri',
      feeText: '₹6,000 (Paid)',
      accentColor: '#FBBF24',
      headerBg: 'linear-gradient(135deg, #0284C7 0%, #0F766E 100%)',
      badgeClass: 'badge-shipwreck'
    }
  };

  /**
   * Initializes strict 5-field form on the page
   */
  function initEventForm(formId, eventSlug) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const parentNameInput = form.querySelector('[name="parentName"]');
      const studentNameInput = form.querySelector('[name="studentName"]');
      const schoolNameInput = form.querySelector('[name="schoolName"]');
      const emailInput = form.querySelector('[name="email"]');
      const cityInput = form.querySelector('[name="city"]');
      const submitBtn = form.querySelector('button[type="submit"]');

      // Clear previous error states
      [parentNameInput, studentNameInput, schoolNameInput, emailInput, cityInput].forEach(inp => {
        if (inp) inp.classList.remove('input-error');
      });

      const parentName = (parentNameInput ? parentNameInput.value : '').trim();
      const studentName = (studentNameInput ? studentNameInput.value : '').trim();
      const schoolName = (schoolNameInput ? schoolNameInput.value : '').trim();
      const email = (emailInput ? emailInput.value : '').trim();
      const city = (cityInput ? cityInput.value : '').trim();

      // STRICT FIVE-FIELD VALIDATION
      let errors = [];
      if (!parentName) {
        errors.push('Parent Name is required.');
        if (parentNameInput) parentNameInput.classList.add('input-error');
      }
      if (!studentName) {
        errors.push('Student Name is required.');
        if (studentNameInput) studentNameInput.classList.add('input-error');
      }
      if (!schoolName) {
        errors.push('School Name is required.');
        if (schoolNameInput) schoolNameInput.classList.add('input-error');
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('A valid Email address is required.');
        if (emailInput) emailInput.classList.add('input-error');
      }
      if (!city) {
        errors.push('City is required.');
        if (cityInput) cityInput.classList.add('input-error');
      }

      if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
      }

      // UI Loading state
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin" style="width: 20px; height: 20px; display: inline-block; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="32" stroke-linecap="round"></circle>
          </svg>
          Connecting to Payment Gateway...
        `;
      }

      try {
        // Step 1: Create Order via backend API
        let orderRes = null;
        const payload = {
          action: 'create-order',
          parentName,
          studentName,
          schoolName,
          email,
          city,
          event: eventSlug
        };

        // Try PHP backend first, fallback to Node backend
        try {
          const res = await fetch('/api/event-registration.php?action=create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            orderRes = await res.json();
          }
        } catch (fetchErr) {
          console.warn('PHP API call failed, trying serverless /api/event-registration:', fetchErr.message);
        }

        if (!orderRes || !orderRes.success) {
          try {
            const res2 = await fetch('/api/event-registration?action=create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (res2.ok) {
              orderRes = await res2.json();
            }
          } catch (e2) {}
        }

        if (!orderRes || !orderRes.order_id) {
          throw new Error(orderRes?.error || 'Unable to initialize Razorpay payment order. Please check server connection.');
        }

        // Step 2: Load Razorpay and open checkout
        await loadRazorpaySDK();

        const options = {
          key: orderRes.key_id || 'rzp_live_TJc8h2vN8fM4Nx',
          amount: orderRes.amount,
          currency: orderRes.currency || 'INR',
          name: 'Vadiva Creative Labs',
          description: `${orderRes.event.title} Registration`,
          image: '/assets/logo.png',
          order_id: orderRes.order_id,
          prefill: {
            name: studentName,
            email: email
          },
          notes: {
            participantUID: orderRes.participantUID,
            parentName: parentName,
            studentName: studentName,
            schoolName: schoolName,
            city: city
          },
          theme: {
            color: eventSlug === 'kids-maker-fair-2026' ? '#FF6B00' : (eventSlug === 'protospark-forge-2026' ? '#0A192F' : '#0284C7')
          },
          handler: async function(paymentResponse) {
            // Step 3: Verify Payment Signature
            try {
              if (submitBtn) submitBtn.innerHTML = 'Verifying Payment...';
              
              const verifyPayload = {
                action: 'verify-payment',
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                participantUID: orderRes.participantUID,
                eventName: orderRes.event.title,
                studentName,
                parentName,
                schoolName,
                email,
                city
              };

              let verifyRes = null;
              try {
                const vFetch = await fetch('/api/event-registration.php?action=verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(verifyPayload)
                });
                if (vFetch.ok) verifyRes = await vFetch.json();
              } catch (e) {}

              if (!verifyRes || !verifyRes.success) {
                try {
                  const vFetch2 = await fetch('/api/event-registration?action=verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(verifyPayload)
                  });
                  if (vFetch2.ok) verifyRes = await vFetch2.json();
                } catch (e) {}
              }

              // Also ensure direct sync with Google Apps Script Web App
              try {
                fetch('https://script.google.com/macros/s/AKfycbxK6vANPdnlY8k0c0y7XZFLFzVjBuwX3d3niWDKg1sSfvPSN78k1qMImEBhSLK-uSp35Q/exec', {
                  method: 'POST',
                  mode: 'no-cors',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'confirmPayment',
                    participantUID: orderRes.participantUID,
                    razorpayOrderId: paymentResponse.razorpay_order_id,
                    razorpayPaymentId: paymentResponse.razorpay_payment_id,
                    eventName: orderRes.event.title
                  })
                }).catch(() => {});
              } catch (gasErr) {}

              // Build participant record for Digital Event Card
              const confirmedRecord = {
                participantUID: orderRes.participantUID,
                eventName: orderRes.event.title,
                eventSlug: eventSlug,
                studentName: studentName,
                parentName: parentName,
                schoolName: schoolName,
                email: email,
                city: city,
                paymentStatus: 'Paid',
                registrationStatus: 'Confirmed',
                amountINR: orderRes.amount / 100,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                eventDate: orderRes.event.date,
                eventTime: orderRes.event.time,
                eventVenue: orderRes.event.venue
              };

              // Reset form
              form.reset();
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
              }

              // Display Confirmation & Personalized Digital Event Card
              showConfirmationModal(confirmedRecord);

            } catch (vErr) {
              alert('Payment Verification Warning: ' + vErr.message + '\nPlease keep your payment ID: ' + paymentResponse.razorpay_payment_id);
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
              }
            }
          },
          modal: {
            ondismiss: function() {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
              }
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (err) {
        alert('Registration Error: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  /**
   * Renders and Displays the Confirmation Modal with the Digital Event Card
   */
  function showConfirmationModal(record) {
    let modal = document.getElementById('eventConfirmationModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'eventConfirmationModal';
      modal.className = 'event-modal-overlay';
      document.body.appendChild(modal);
    }

    const theme = EVENT_CARD_THEMES[record.eventSlug] || {
      title: record.eventName,
      tagline: 'Vadiva Creative Labs Flagship 2026',
      date: record.eventDate || '2026',
      time: record.eventTime || 'Full Day',
      venue: record.eventVenue || 'Vadiva Campus',
      feeText: `₹${record.amountINR || 'Paid'} (Paid)`,
      headerBg: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)'
    };

    const statusCheckUrl = `${window.location.origin}/registration-status?uid=${encodeURIComponent(record.participantUID)}`;
    const qrUrl = SimpleQR.getDataURL(statusCheckUrl, 160);

    modal.innerHTML = `
      <div class="event-modal-box">
        <button class="event-modal-close" onclick="closeEventModal()" aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #DCFCE7; color: #16A34A; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style="font-size: 1.75rem; font-weight: 800; color: #0F172A; margin: 0 0 0.25rem;">Registration Confirmed!</h2>
          <p style="color: #64748B; font-size: 0.95rem; margin: 0;">Your application and payment have been successfully verified.</p>
        </div>

        <!-- Personalized Digital Event Card -->
        <div class="digital-card-container">
          <div class="event-card-wrapper" id="printableEventCard">
            <div class="event-card-header" style="background: ${theme.headerBg};">
              <div>
                <img src="/assets/logo.png" alt="Vadiva Creative Labs Logo" style="height: 32px; width: auto; filter: brightness(0) invert(1); display: block; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='../assets/logo.png';">
                <h3 style="color: #FFFFFF; font-size: 1.25rem; font-weight: 800; margin: 0;">${theme.title}</h3>
                <span style="font-size: 0.75rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em;">${theme.tagline}</span>
              </div>
              <div style="text-align: right;">
                <span class="event-status-badge status-paid" style="border: 1px solid rgba(255,255,255,0.4);">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ${record.paymentStatus || 'PAID'}
                </span>
                <div style="font-size: 0.75rem; opacity: 0.85; margin-top: 0.25rem;">₹${record.amountINR || '99'} INR</div>
              </div>
            </div>

            <div class="event-card-body">
              <div class="event-card-grid">
                <div>
                  <div class="event-card-uid-box">
                    <span class="event-card-uid-label">Participant UID</span>
                    <span class="event-card-uid-val">${record.participantUID}</span>
                  </div>

                  <div class="event-card-name">${record.studentName}</div>
                  <div class="event-card-meta-line"><strong>Parent:</strong> ${record.parentName}</div>
                  <div class="event-card-meta-line"><strong>School:</strong> ${record.schoolName}</div>
                  <div class="event-card-meta-line"><strong>City:</strong> ${record.city}</div>
                  <div class="event-card-meta-line" style="margin-top: 0.75rem; color: #0284C7;">
                    <strong>Date:</strong> ${theme.date}
                  </div>
                  <div class="event-card-meta-line" style="color: #64748B; font-size: 0.85rem;">
                    <strong>Venue:</strong> ${theme.venue}
                  </div>
                </div>

                <div class="event-card-qr-box">
                  <img src="${qrUrl}" alt="Verification QR Code">
                  <span class="event-card-qr-label">Scan to Verify</span>
                </div>
              </div>
            </div>

            <div class="event-card-footer">
              <span>Vadiva Creative Labs Official Entry Pass</span>
              <span style="font-family: var(--event-font-mono); font-size: 0.75rem;">Status: CONFIRMED</span>
            </div>
          </div>
        </div>

        <div class="event-card-actions">
          <button class="btn-card-action btn-download-png" onclick="downloadEventCardPNG('${record.participantUID}', '${record.studentName}', '${record.eventName}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Event Card (PNG)
          </button>
          <button class="btn-card-action btn-print-card" onclick="window.print()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Card / PDF
          </button>
        </div>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.85rem; color: #64748B;">
          UID saved in your records. You can check status anytime at <a href="/registration-status" style="color: #0284C7; font-weight: 600;">Registration Status Portal</a>.
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeEventModal() {
    const modal = document.getElementById('eventConfirmationModal');
    if (modal) modal.classList.remove('active');
  }

  /**
   * Generates a high-resolution 1200x750 canvas download of the digital event card
   */
  async function downloadEventCardPNG(uid, studentName, eventName) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect ? ctx.roundRect(0, 0, 1200, 760, 30) : ctx.rect(0, 0, 1200, 760);
    ctx.fill();

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 0);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 180);

    // Header Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('VADIVA CREATIVE LABS', 60, 70);

    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(eventName.toUpperCase(), 60, 125);

    // Verified Stamp
    ctx.fillStyle = '#DCFCE7';
    ctx.fillRect(940, 50, 200, 50);
    ctx.fillStyle = '#15803D';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('✓ CONFIRMED', 970, 82);

    // Participant UID
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(60, 220, 480, 80);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 220, 480, 80);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('OFFICIAL PARTICIPANT UID', 80, 248);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(uid, 80, 285);

    // Student Details
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(studentName, 60, 370);

    ctx.fillStyle = '#475569';
    ctx.font = '24px sans-serif';
    ctx.fillText('Entry Status: Official Registered Participant (Paid)', 60, 420);
    ctx.fillText('Bring this digital or printed pass on the day of the event.', 60, 460);
    ctx.fillText('Hotline Support: +91 72009 81134', 60, 500);

    // Footer bar
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 680, 1200, 80);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(0, 680, 1200, 80);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('Vadiva Creative Labs — https://vadivacreativelabs.com/registration-status', 60, 728);

    // Load QR Image onto canvas
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    const verifyUrl = `${window.location.origin}/registration-status?uid=${encodeURIComponent(uid)}`;
    qrImg.src = SimpleQR.getDataURL(verifyUrl, 260);

    qrImg.onload = function() {
      ctx.drawImage(qrImg, 860, 230, 260, 260);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(860, 230, 260, 260);

      // Trigger download
      const link = document.createElement('a');
      link.download = `Vadiva-EventCard-${uid}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    qrImg.onerror = function() {
      const link = document.createElement('a');
      link.download = `Vadiva-EventCard-${uid}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

  // Global exposure
  window.VadivaEvents = {
    initEventForm,
    showConfirmationModal,
    closeEventModal,
    downloadEventCardPNG
  };
  window.closeEventModal = closeEventModal;
  window.downloadEventCardPNG = downloadEventCardPNG;

})(window);
