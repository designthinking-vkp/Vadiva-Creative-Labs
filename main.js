/* ==========================================================================
   VADIVA CREATIVE LABS - Global JS File
   Logic: Navigation highlighting, mobile toggles, count-up animations, tabs, forms
   ========================================================================== */

// Deployed Google Apps Script URL for Google Sheet submissions
// Replace this placeholder with your actual deployed Web App URL after creating the script.
const CONTACT_FORM_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwz3D3bYe2xdIY2HWMPHwnZJaDpEV_cHlBB-nRSgZ-YeL-uGoF00lEvxQ9d-oF5j5CQ/exec';

/* ==========================================================================
   CENTRALIZED TEMPORARY CAMPAIGN CONFIGURATION (15-DAY CAMPAIGN UPDATE)
   Campaign Period: 19 August 2026 to 03 September 2026 (IST / Asia-Kolkata)
   ========================================================================== */
const CAMPAIGN_CONFIG = {
  enabled: true,
  startDate: "2026-08-19T00:00:00+05:30",
  endDate: "2026-09-03T23:59:59.999+05:30",
  originalLogo: "assets/logo.png",
  temporaryLogo: "assets/logo.png",
  originalEventDate: "19th & 20th August 2026",
  campaignEventDate: "OCT 30 & 31",
  registrationStatusText: "Registration Open",
  footerBrandingText: "A Product of Velammal Knowledge Park",
  showRegistrationClosingDate: false,
  showRegistrationClosingTime: false,

  /**
   * Checks if the temporary campaign is active in IST.
   * Accepts optional customDate for testing/simulation purposes.
   */
  isActive: function(customDate) {
    if (!this.enabled) return false;
    const now = customDate ? new Date(customDate) : new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return now >= start && now <= end;
  },

  /**
   * Returns the appropriate logo path.
   */
  getLogo: function(customDate, pathPrefix = '') {
    const isTemp = this.isActive(customDate);
    const logoFile = isTemp ? this.temporaryLogo : this.originalLogo;
    return pathPrefix ? pathPrefix + logoFile : logoFile;
  },

  /**
   * Returns the appropriate event date string.
   */
  getEventDate: function(customDate) {
    return this.isActive(customDate) ? this.campaignEventDate : this.originalEventDate;
  }
};
window.CAMPAIGN_CONFIG = CAMPAIGN_CONFIG;

/**
 * Applies or reverts temporary campaign modifications site-wide based on date.
 */
function applyCampaignUpdates(customDate) {
  const isCampaignActive = CAMPAIGN_CONFIG.isActive(customDate);

  // 1. Site-Wide Logo Update & Favicon (Disabled per request to keep Vadiva logo as primary site-wide)
  /*
  const logoElements = document.querySelectorAll('img');
  logoElements.forEach(img => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    
    // Identify Vadiva logo images across the site
    const isVadivaLogo = (
      src.includes('logo.png') || 
      src.includes('temp%20vadiva%20logo.png') || 
      src.includes('temp vadiva logo.png') ||
      img.closest('.logo') !== null ||
      img.closest('.footer-about') !== null ||
      (alt.toLowerCase().includes('vadiva') && alt.toLowerCase().includes('logo'))
    );
    
    // Exclude partner logos or non-brand utility icons
    const isExcluded = (
      src.includes('dr-herald') || 
      src.includes('cyberjaya') || 
      src.includes('protospark-logo') || 
      src.includes('yuci') ||
      alt.toLowerCase().includes('copy')
    );

    if (isVadivaLogo && !isExcluded) {
      const isAbsolute = src.startsWith('/') && window.location.protocol.startsWith('http');
      const prefix = isAbsolute ? '/' : (src.startsWith('../') ? '../' : (src.startsWith('./') ? './' : ''));
      if (isCampaignActive) {
        img.src = prefix + 'assets/temp vadiva logo.png';
        if (img.style.width && img.style.width.includes('px') && parseInt(img.style.width) > 60) {
          img.style.width = 'auto';
        }
        img.style.objectFit = 'contain';
      } else {
        img.src = prefix + 'assets/logo.png';
      }
    }
  });

  // Favicon dynamic update
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(icon => {
    const href = icon.getAttribute('href') || '';
    if (href.includes('logo.png') || href.includes('temp%20vadiva%20logo') || href.includes('temp vadiva logo')) {
      const isAbsolute = href.startsWith('/') && window.location.protocol.startsWith('http');
      const prefix = isAbsolute ? '/' : (href.startsWith('../') ? '../' : (href.startsWith('./') ? './' : ''));
      icon.href = isCampaignActive ? (prefix + 'assets/temp vadiva logo.png') : (prefix + 'assets/logo.png');
    }
  });
  */

  // 2. Protospark Event Date Update (OCT 30 & 31)
  document.querySelectorAll('[data-campaign-event-date]').forEach(el => {
    el.textContent = isCampaignActive ? CAMPAIGN_CONFIG.campaignEventDate : CAMPAIGN_CONFIG.originalEventDate;
  });

  document.querySelectorAll('.meta-card-item, .protospark-meta-card').forEach(card => {
    const h4 = card.querySelector('h4');
    const p = card.querySelector('p');
    if (h4 && p && h4.textContent.toLowerCase().includes('event on')) {
      p.textContent = isCampaignActive ? CAMPAIGN_CONFIG.campaignEventDate : CAMPAIGN_CONFIG.originalEventDate;
    }
  });

  // 3. Footer Branding: "A Product of Velammal Knowledge Park"
  document.querySelectorAll('.footer-bottom').forEach(footerBottom => {
    let brandingEl = footerBottom.querySelector('.footer-campaign-branding');
    if (isCampaignActive) {
      if (!brandingEl) {
        brandingEl = document.createElement('p');
        brandingEl.className = 'footer-campaign-branding';
        brandingEl.textContent = CAMPAIGN_CONFIG.footerBrandingText;
        const children = footerBottom.children;
        if (children.length >= 2) {
          footerBottom.insertBefore(brandingEl, children[1]);
        } else {
          footerBottom.appendChild(brandingEl);
        }
      } else {
        brandingEl.textContent = CAMPAIGN_CONFIG.footerBrandingText;
        brandingEl.style.display = '';
      }
    } else {
      if (brandingEl) {
        brandingEl.remove();
      }
    }
  });

  // 4. Registration Status & Suppression of Closing Dates / Countdowns
  if (isCampaignActive) {
    // Hide any registration countdown timers if present
    const countdownContainers = document.querySelectorAll('#registration-countdown, .registration-countdown, [data-registration-countdown]');
    countdownContainers.forEach(el => {
      const parentBlock = el.closest('.countdown-box, .registration-countdown-container') || el;
      parentBlock.style.display = 'none';
    });

    // Remove or suppress stale pre-registration banners
    const announcementBanners = document.querySelectorAll('.announcement-banner');
    announcementBanners.forEach(banner => {
      banner.style.display = 'none';
    });
  }
}
window.applyCampaignUpdates = applyCampaignUpdates;

// Run immediately if DOM is already parsed
if (typeof document !== 'undefined' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
  applyCampaignUpdates();
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('load', () => {
    applyCampaignUpdates();
  });
}

if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', () => {
    // Apply campaign configuration updates across the page
    applyCampaignUpdates();


  // 00. Protospark Registration Auto-Scheduler
  const REGISTRATION_START_DATE = new Date(2026, 6, 10); // July 10, 2026 (July is Month index 6)
  const isBeforeRegStart = (new Date() < REGISTRATION_START_DATE) && !CAMPAIGN_CONFIG.isActive();

  if (isBeforeRegStart) {
    // Inject global announcement banner at the top of the body (skip on standard registration form page)
    const isStandardRegPage = window.location.pathname.includes('protospark-register.html') || window.location.pathname.endsWith('protospark-register');
    if (!isStandardRegPage) {
      const banner = document.createElement('div');
      banner.className = 'announcement-banner';
      
      const isEarlyAccessPage = window.location.pathname.includes('protospark-registration-earlyaccess');
      if (isEarlyAccessPage) {
        banner.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px; vertical-align: middle;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Registrations Open to Everyone Starting July 10, 2026.</span>
        `;
      } else {
        banner.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px; vertical-align: middle;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Registration for Protospark '26 starts on July 10th, 2026.</span>
          <a href="protospark.html">Learn More &rarr;</a>
        `;
      }
      document.body.insertBefore(banner, document.body.firstChild);
    }

    // Handle registration CTAs on the Protospark landing page
    if (window.location.pathname.includes('protospark')) {
      const regButtons = document.querySelectorAll('.btn-protospark-register');
      regButtons.forEach(btn => {
        btn.innerHTML = `
          Registration starts July 10th, 2026
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        `;
        btn.href = 'javascript:void(0)';
        btn.style.cursor = 'not-allowed';
        btn.style.opacity = '0.85';
        btn.style.background = 'linear-gradient(135deg, #64748b, #475569)';
        btn.style.border = 'none';
        btn.style.pointerEvents = 'none'; // Disables hover and clicks completely
        btn.addEventListener('click', (e) => {
          e.preventDefault();
        });
      });
    }
  }

  // 0. Clean URLs Dynamic Rewriting (only on http/https web servers, not local file:// previews)
  if (window.location.protocol.startsWith('http')) {
    document.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.endsWith('.html') && !href.startsWith('http')) {
        if (href === 'index.html') {
          link.setAttribute('href', './');
        } else {
          link.setAttribute('href', href.replace('.html', ''));
        }
      }
    });
  }

  // 1. Mobile Menu Toggle
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('nav.main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mainNav.classList.toggle('active');

      // Animate hamburger lines
      const spans = menuToggle.querySelectorAll('span');
      if (mainNav.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // 2. Active Link Highlighting
  const navLinks = document.querySelectorAll('nav.main-nav a');
  const currentPath = window.location.pathname;
  const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalize href and current path for comparison
    const normHref = href.replace('.html', '').replace(/^\.\//, '').replace(/^\//, '');
    const normFile = currentFile.replace('.html', '').replace(/^\.\//, '').replace(/^\//, '');

    const isHomeHref = normHref === '' || normHref === 'index';
    const isHomePath = normFile === '' || normFile === 'index';

    if ((isHomeHref && isHomePath) || (normHref !== '' && normFile === normHref)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 3. Stats Counter Animation (Intersection Observer)
  const statNumbers = document.querySelectorAll('.stat-number');

  if (statNumbers.length > 0) {
    const animateCounters = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const targetNum = parseInt(target.getAttribute('data-target'), 10);
          const suffix = target.getAttribute('data-suffix') || '';
          let count = 0;
          const duration = 1500; // ms
          const increment = targetNum / (duration / 16); // ~60fps

          const counter = setInterval(() => {
            count += increment;
            if (count >= targetNum) {
              target.textContent = targetNum.toLocaleString() + suffix;
              clearInterval(counter);
            } else {
              target.textContent = Math.floor(count).toLocaleString() + suffix;
            }
          }, 16);

          observer.unobserve(target); // Only animate once
        }
      });
    };

    const observerOptions = {
      root: null,
      threshold: 0.1
    };

    const counterObserver = new IntersectionObserver(animateCounters, observerOptions);
    statNumbers.forEach(num => counterObserver.observe(num));
  }

  // 4. Parent Hub Tabs Switcher
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabButtons.length > 0 && tabContents.length > 0) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        // Deactivate all buttons & contents
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate current button & content
        btn.classList.add('active');
        const activeContent = document.getElementById(targetTab);
        if (activeContent) {
          activeContent.classList.add('active');
        }
      });
    });
  }

  // 5. Contact Form Submission
  const contactForm = document.getElementById('institutional-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit Inquiry';

      // Get Form fields
      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const category = document.getElementById('contact-category').value;
      const message = document.getElementById('contact-message').value;

      // Loading state for button
      if (submitBtn) {
        submitBtn.innerHTML = 'Sending Request...';
        submitBtn.disabled = true;
      }

      // Use URLSearchParams for x-www-form-urlencoded format (highly stable with Google Script e.parameter)
      const formData = new URLSearchParams();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('category', category);
      formData.append('message', message);

      // Helper function to render success popup modal
      const showSuccessModal = () => {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
        modal.style.backdropFilter = 'blur(5px)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '999';

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#ffffff';
        modalContent.style.border = '4px solid #1e293b';
        modalContent.style.padding = '3rem';
        modalContent.style.borderRadius = '8px';
        modalContent.style.maxWidth = '500px';
        modalContent.style.width = '90%';
        modalContent.style.boxShadow = '8px 8px 0px #f37e4b';
        modalContent.style.textAlign = 'center';

        modalContent.innerHTML = `
          <h3 style="margin-bottom: 1rem; color: #306fa7;">Request Submitted!</h3>
          <p style="margin-bottom: 1.5rem; color: #475569;">Thank you for contacting Vadiva Creative Labs, <strong>${name}</strong>. We have registered your interest under the channel <strong>${category}</strong>. Our core team will reach out to you within 24 business hours.</p>
          <button id="close-modal-btn" class="btn btn-primary" style="width: 100%;">Return to Site</button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        document.getElementById('close-modal-btn').addEventListener('click', () => {
          document.body.removeChild(modal);
          contactForm.reset();
        });
      };

      // Send post request to Google Sheet Web App (if configured)
      if (CONTACT_FORM_SCRIPT_URL && CONTACT_FORM_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL') {
        fetch(CONTACT_FORM_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Bypasses browser preflight CORS blocks
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        })
          .then(() => {
            showSuccessModal();
          })
          .catch(err => {
            console.error('Google Sheet submission failed:', err);
            // Fallback to show success modal so user is not stuck
            showSuccessModal();
          })
          .finally(() => {
            if (submitBtn) {
              submitBtn.innerHTML = originalBtnText;
              submitBtn.disabled = false;
            }
          });
      } else {
        // Fallback for development if URL is not configured yet
        console.warn('Google Sheet submission URL (CONTACT_FORM_SCRIPT_URL) is not configured yet.');
        setTimeout(() => {
          showSuccessModal();
          if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
          }
        }, 800);
      }
    });
  }

  // 6. Custom Magnetic Cursor Effect (Desktop only, loaded via GSAP)
  if (typeof gsap !== 'undefined') {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    // Only initialize on desktop screens without touch interface
    if (!isTouchDevice && window.innerWidth > 1200) {
      // Create and append cursor elements dynamically
      const cursorDot = document.createElement('div');
      cursorDot.className = 'custom-cursor-dot';
      const cursorRing = document.createElement('div');
      cursorRing.className = 'custom-cursor-ring';
      const cursorGlow = document.createElement('div');
      cursorGlow.className = 'custom-cursor-glow';

      document.body.appendChild(cursorDot);
      document.body.appendChild(cursorRing);
      document.body.appendChild(cursorGlow);
      document.body.classList.add('custom-cursor-active');

      // Set up quickTo positioning for maximum performance (GPU accelerated)
      const xToDot = gsap.quickTo(cursorDot, "x", { duration: 0.08, ease: "power3.out" });
      const yToDot = gsap.quickTo(cursorDot, "y", { duration: 0.08, ease: "power3.out" });
      const xToRing = gsap.quickTo(cursorRing, "x", { duration: 0.25, ease: "power3.out" });
      const yToRing = gsap.quickTo(cursorRing, "y", { duration: 0.25, ease: "power3.out" });
      const xToGlow = gsap.quickTo(cursorGlow, "x", { duration: 0.5, ease: "power2.out" });
      const yToGlow = gsap.quickTo(cursorGlow, "y", { duration: 0.5, ease: "power2.out" });

      window.addEventListener("mousemove", (e) => {
        xToDot(e.clientX);
        yToDot(e.clientY);
        xToRing(e.clientX);
        yToRing(e.clientY);
        xToGlow(e.clientX);
        yToGlow(e.clientY);
      });

      // Show/Hide custom cursor on leaving viewport
      document.addEventListener("mouseleave", () => {
        gsap.to([cursorDot, cursorRing, cursorGlow], { opacity: 0, duration: 0.2 });
      });
      document.addEventListener("mouseenter", () => {
        gsap.to([cursorDot, cursorRing, cursorGlow], { opacity: 1, duration: 0.2 });
      });

      // Click animations for custom cursor (mousedown: shrink dot, scale up ring; mouseup: spring back)
      window.addEventListener("mousedown", () => {
        gsap.to(cursorDot, { scale: 0.5, duration: 0.1, overwrite: "auto" });
        gsap.to(cursorRing, { scale: 0.7, duration: 0.1, overwrite: "auto" });
      });
      window.addEventListener("mouseup", () => {
        gsap.to(cursorDot, { scale: 1.0, duration: 0.2, overwrite: "auto" });
        const targetScale = document.body.classList.contains('custom-cursor-hovering') ? 1.5 : 1.0;
        gsap.to(cursorRing, { scale: targetScale, duration: 0.2, overwrite: "auto" });
      });

      // Targets for cursor hover effects and card tilt
      const magneticTargets = document.querySelectorAll(
        'nav.main-nav a, .logo a, .btn, .feature-card, .activity-card, .workshop-card, .stat-card, .tab-btn, .social-link, .faq-question, .footer-links a, table.comm-matrix-table a'
      );

      magneticTargets.forEach(el => {
        el.classList.add('magnetic-target');

        // Hover scale configs
        let radius = 70;
        let scale = 1.0;

        const isCard = el.classList.contains('feature-card') || el.classList.contains('activity-card') || el.classList.contains('workshop-card') || el.classList.contains('stat-card');

        if (el.classList.contains('btn')) {
          radius = 80;
          scale = 1.05;
        } else if (isCard) {
          radius = 120;
          scale = 1.02;
          if (el.parentElement) {
            el.parentElement.style.perspective = "1000px";
          }
        } else if (el.tagName === 'A' && el.closest('nav')) {
          radius = 65;
          scale = 1.08;
        }

        let isHovering = false;

        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const elCenterX = rect.left + rect.width / 2;
          const elCenterY = rect.top + rect.height / 2;

          const deltaX = e.clientX - elCenterX;
          const deltaY = e.clientY - elCenterY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < radius) {
            if (!isHovering) {
              isHovering = true;
              document.body.classList.add('custom-cursor-hovering');

              gsap.to(cursorRing, {
                scale: scale * 1.5,
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(243, 126, 75, 0.06)',
                duration: 0.3
              });

              gsap.to(el, { scale: scale, duration: 0.3 });
            }

            // 3D Tilt for cards
            if (isCard) {
              const tiltX = -(deltaY / (rect.height / 2)) * 6;
              const tiltY = (deltaX / (rect.width / 2)) * 6;
              gsap.to(el, {
                rotateX: tiltX,
                rotateY: tiltY,
                transformPerspective: 1000,
                duration: 0.3,
                overwrite: "auto"
              });
            }
          } else {
            resetAttr();
          }
        });

        el.addEventListener('mouseleave', () => {
          resetAttr();
        });

        function resetAttr() {
          if (isHovering) {
            isHovering = false;
            document.body.classList.remove('custom-cursor-hovering');

            gsap.to(cursorRing, {
              scale: 1.0,
              borderColor: 'rgba(243, 126, 75, 0.4)',
              backgroundColor: 'rgba(243, 126, 75, 0)',
              duration: 0.3
            });
          }

          gsap.to(el, { scale: 1.0, duration: 0.6, ease: "elastic.out(1.1, 0.6)" });
          if (isCard) {
            gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power2.out" });
          }
        }
      });
    }
  }

  // 7. Online Payment Terms Modal & Redirect
  const createPaymentModal = () => {
    if (document.getElementById('payment-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'payment-modal';
    overlay.className = 'payment-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'payment-modal-title');

    overlay.innerHTML = `
      <div class="payment-modal-container">
        <button class="payment-modal-close" id="payment-close-btn" aria-label="Close dialog">&times;</button>
        <div class="payment-modal-header">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
          <h2 id="payment-modal-title">Online Payment</h2>
        </div>
        <div class="payment-modal-body">
          <h4 class="payment-modal-subheader">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            Important Note :-
          </h4>
          <ul class="payment-notes-list">
            <li>
              <div class="note-icon-container">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 12V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h1v3.5c0 .3.4.5.6.3L9.7 18H14c1.1 0 2-.9 2-2v-2h2.5c.3 0 .5-.4.3-.6L16 12z"/>
                </svg>
              </div>
              <p>Please don't refresh or close your browser during the payment until you are redirected back to our website.</p>
            </li>
            <li>
              <div class="note-icon-container">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 12V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h1v3.5c0 .3.4.5.6.3L9.7 18H14c1.1 0 2-.9 2-2v-2h2.5c.3 0 .5-.4.3-.6L16 12z"/>
                </svg>
              </div>
              <p>Please use Chrome or Firefox for online payment.</p>
            </li>
            <li>
              <div class="note-icon-container">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 12V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h1v3.5c0 .3.4.5.6.3L9.7 18H14c1.1 0 2-.9 2-2v-2h2.5c.3 0 .5-.4.3-.6L16 12z"/>
                </svg>
              </div>
              <p>Please feel free to contact us if you have any further queries.</p>
            </li>
            <li>
              <div class="note-icon-container">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 12V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h1v3.5c0 .3.4.5.6.3L9.7 18H14c1.1 0 2-.9 2-2v-2h2.5c.3 0 .5-.4.3-.6L16 12z"/>
                </svg>
              </div>
              <p>In case of issue/queries with online payment, please contact <a href="mailto:paymentgateway@velammalbodhicampus.com">paymentgateway@velammalbodhicampus.com</a></p>
            </li>
            <li>
              <div class="note-icon-container">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 12V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h1v3.5c0 .3.4.5.6.3L9.7 18H14c1.1 0 2-.9 2-2v-2h2.5c.3 0 .5-.4.3-.6L16 12z"/>
                </svg>
              </div>
              <p>When emailing technical support, please send us following details - School Name, Student Name, Admission Number, Date of Birth, Parent Name & Contact Number.</p>
            </li>
          </ul>
        </div>
        <div class="payment-modal-footer">
          <button class="btn btn-secondary" id="payment-cancel-btn">Cancel / Back</button>
          <button class="btn btn-primary" id="payment-proceed-btn">Proceed to Payment</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Event listeners
    const proceedBtn = document.getElementById('payment-proceed-btn');
    const cancelBtn = document.getElementById('payment-cancel-btn');
    const closeBtn = document.getElementById('payment-close-btn');

    const closeModal = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeModal();
      }
    });

    proceedBtn.addEventListener('click', () => {
      window.location.href = 'https://vbpro.org/app/payment';
    });
  };

  const initPaymentTriggers = () => {
    createPaymentModal();

    const triggers = document.querySelectorAll('.payment-nav-link');
    const overlay = document.getElementById('payment-modal');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        
        // If mobile nav active, close it
        const mainNav = document.querySelector('nav.main-nav');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        if (mainNav && mainNav.classList.contains('active')) {
          mainNav.classList.remove('active');
          const spans = menuToggle.querySelectorAll('span');
          if (spans.length >= 3) {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
          }
        }

        if (overlay) {
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  };

  // 13. Protospark Promo Pop-up modal
  const initPromoPopup = () => {
    const modal = document.getElementById('protospark-popup-modal');
    if (!modal) return;

    // Check if user already closed it in this session
    if (sessionStorage.getItem('protospark_popup_closed') === 'true') {
      modal.remove();
      return;
    }

    // Show modal after a delay (e.g., 1.5s)
    setTimeout(() => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // prevent scrolling behind modal
    }, 1500);

    const closeBtn = modal.querySelector('.popup-modal-close');
    const overlay = modal.querySelector('.popup-modal-overlay');

    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      sessionStorage.setItem('protospark_popup_closed', 'true');
      setTimeout(() => {
        modal.remove();
      }, 500); // match CSS fade-out transition duration
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
  };

  initPromoPopup();
  initPaymentTriggers();
});
}

