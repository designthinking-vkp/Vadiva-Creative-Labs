/**
 * Razorpay Standard Checkout Helper Module ($20 USD / ₹1920 INR Dynamic Location)
 * Includes Google Apps Script integration & Professional Dual-Logo PDF Receipt Generator
 */
(function(window) {
  'use strict';

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2JL8sKCi_8W0-53VE8aovpU570RbSYldQkVwq2D1v9QDy_9TbJNlZ2JUy1LhufiBE/exec';

  /**
   * Automatically detects user location (India vs Outside India)
   */
  async function detectUserGeoLocation() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IN';
      const langs = navigator.languages || [navigator.language || ''];
      if (langs.some(l => l && l.toLowerCase().endsWith('-in'))) return 'IN';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.country_code) return data.country_code;
      }
    } catch (e) {
      // Fallback to timezone
    }
    return 'IN';
  }

  /**
   * Initiates Razorpay Standard Checkout ($20 USD / ₹1920 INR depending on location)
   * @param {Object} options - Custom options (prefill, callbacks, etc.)
   */
  async function initiateRazorpayCheckout(options = {}) {
    let countryCode = options.countryCode;
    if (!countryCode) {
      countryCode = await detectUserGeoLocation();
    }

    const isIndia = countryCode === 'IN';
    const currency = options.currency || (isIndia ? 'INR' : 'USD');
    let amountSubunits = isIndia ? 192000 : 2000;
    let formattedAmount = isIndia ? '₹1,920 INR' : '$20.00 USD';

    if (options.amountINR || (options.amount && currency === 'INR')) {
      const amountINR = options.amountINR || options.amount || 1920;
      amountSubunits = Math.round(amountINR * 100);
      formattedAmount = `₹${amountINR.toLocaleString('en-IN')} INR`;
    } else if (options.amountUSD || (options.amount && currency === 'USD')) {
      const amountUSD = options.amountUSD || options.amount || 20.00;
      amountSubunits = Math.round(amountUSD * 100);
      formattedAmount = `$${amountUSD.toFixed(2)} USD`;
    }

    const amountCents = amountSubunits;

    const triggerBtn = options.triggerButton;
    let originalText = '';
    if (triggerBtn) {
      originalText = triggerBtn.innerText;
      triggerBtn.innerText = 'Processing...';
      triggerBtn.disabled = true;
    }

    try {
      // 1. Order Creation Sequence: Hostinger PHP -> Node API -> Google Apps Script
      let orderData = null;
      let lastError = null;

      // Try 1: Hostinger PHP Endpoint (/api/create-order.php)
      try {
        const phpRes = await fetch('/api/create-order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountCents,
            currency: currency,
            receipt: options.receipt || `rcpt_${Date.now()}`
          })
        });
        if (phpRes.ok) {
          orderData = await phpRes.json();
        }
      } catch (err1) {
        lastError = err1;
      }

      // Try 2: Vercel / Node Serverless Endpoint (/api/create-order)
      if (!orderData || !orderData.success || !orderData.order) {
        try {
          const nodeRes = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amountCents,
              currency: currency,
              receipt: options.receipt || `rcpt_${Date.now()}`
            })
          });
          if (nodeRes.ok) {
            orderData = await nodeRes.json();
          }
        } catch (err2) {
          lastError = err2;
        }
      }

      // Try 3: Google Apps Script Backend (Fallback for static hosting & file://)
      if (!orderData || !orderData.success || !orderData.order) {
        try {
          const appsScriptRes = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'createRazorpayOrder',
              amount: amountCents,
              currency: currency,
              receipt: options.receipt || `rcpt_${Date.now()}`
            })
          });
          const text = await appsScriptRes.text();
          try {
            orderData = JSON.parse(text);
          } catch (pErr) {
            console.error('Apps Script raw response:', text);
          }
        } catch (err3) {
          lastError = err3;
        }
      }

      // Parse order object from Razorpay response structure
      let orderObj = null;
      if (orderData) {
        if (orderData.order && orderData.order.id) {
          orderObj = orderData.order;
        } else if (orderData.id) {
          orderObj = orderData;
        }
      }

      if (!orderObj || !orderObj.id) {
        const errorMsg = orderData?.error?.description 
          || orderData?.error?.message 
          || (typeof orderData?.error === 'string' ? orderData.error : '')
          || orderData?.message
          || lastError?.message
          || 'Unable to connect to Razorpay Order Creation service. Please ensure API files are uploaded to Hostinger public_html/api/ and Google Apps Script is updated.';
        throw new Error(errorMsg);
      }

      const order = orderObj;
      const keyId = orderData?.key_id || 'rzp_live_TJc8h2vN8fM4Nx';

      if (typeof window.Razorpay === 'undefined') {
        await loadRazorpaySDK();
      }

      // 2. Configure Client-side Checkout options
      const checkoutOptions = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: options.businessName || 'Vadiva Creative Labs',
        description: options.description || `Payment of ${formattedAmount}`,
        image: options.image || '/assets/logo.png',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment Signature on server or fallback
            let isValid = false;
            let verifyData = null;
            const isFileProtocol = window.location.protocol === 'file:';

            if (!isFileProtocol) {
              try {
                const verifyResponse = await fetch('/api/verify-signature.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
                if (verifyResponse.ok) {
                  verifyData = await verifyResponse.json();
                  isValid = verifyData.success;
                }
              } catch (verifyFetchErr) {
                console.warn('Verification endpoint unreachable:', verifyFetchErr.message);
              }
            }

            // Fallback for file:// or offline verification
            if (verifyData === null) {
              isValid = Boolean(response.razorpay_payment_id && response.razorpay_signature);
            }

            if (isValid) {
              const paymentDetails = {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: formattedAmount,
                currency: currency,
                date: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }),
                businessName: options.businessName || 'Vadiva Creative Labs',
                customerName: options.userName || options.prefill?.name || 'Valued Customer',
                customerEmail: options.userEmail || options.prefill?.email || 'N/A',
                registrationId: options.registrationId || ''
              };

              // 4. Update Google Apps Script / Sheet status asynchronously
              notifyGoogleAppsScript(paymentDetails);

              if (triggerBtn) {
                triggerBtn.innerText = originalText;
                triggerBtn.disabled = false;
              }

              // 5. Show Payment Receipt Modal & PDF generator
              showReceiptModal(paymentDetails);

              if (typeof options.onSuccess === 'function') {
                options.onSuccess(paymentDetails, response);
              }
            } else {
              alert(`Payment Verification Failed: ${verifyData?.error || 'Invalid signature'}`);
              if (triggerBtn) {
                triggerBtn.innerText = originalText;
                triggerBtn.disabled = false;
              }
              if (typeof options.onFailure === 'function') {
                options.onFailure(verifyData);
              }
            }
          } catch (verifyErr) {
            alert(`Signature Verification Error: ${verifyErr.message}`);
            if (triggerBtn) {
              triggerBtn.innerText = originalText;
              triggerBtn.disabled = false;
            }
            if (typeof options.onFailure === 'function') {
              options.onFailure(verifyErr);
            }
          }
        },
        prefill: options.prefill || {
          name: options.userName || '',
          email: options.userEmail || '',
          contact: options.userContact || ''
        },
        theme: options.theme || {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function () {
            if (triggerBtn) {
              triggerBtn.innerText = originalText;
              triggerBtn.disabled = false;
            }
            if (typeof options.onDismiss === 'function') {
              options.onDismiss();
            }
          }
        }
      };

      const rzpInstance = new window.Razorpay(checkoutOptions);

      rzpInstance.on('payment.failed', function (response) {
        if (triggerBtn) {
          triggerBtn.innerText = originalText;
          triggerBtn.disabled = false;
        }
        showPaymentFailureModal(response.error, options);
        if (typeof options.onFailure === 'function') {
          options.onFailure(response.error);
        }
      });

      rzpInstance.open();

    } catch (err) {
      if (triggerBtn) {
        triggerBtn.innerText = originalText;
        triggerBtn.disabled = false;
      }
      showPaymentFailureModal({
        description: err.message || 'Error initiating payment gateway.',
        reason: 'gateway_error'
      }, options);
      if (typeof options.onFailure === 'function') {
        options.onFailure(err);
      }
    }
  }

  /**
   * Displays friendly modal with bank decline explanations, Maybank / international card instructions & WhatsApp support
   */
  function showPaymentFailureModal(err, options = {}) {
    let modal = document.getElementById('razorpay-failure-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'razorpay-failure-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        padding: 1.25rem; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif;
      `;
      document.body.appendChild(modal);
    }

    const regId = options.registrationId || '';
    const errDesc = (err && (err.description || err.message)) ? String(err.description || err.message) : '';
    const errReason = (err && err.reason) ? String(err.reason) : '';
    const errSource = (err && err.source) ? String(err.source) : '';
    const isBankDecline = errReason === 'declined_by_bank' || 
                          errSource === 'issuer_bank' || 
                          errDesc.toLowerCase().includes('declined') ||
                          errDesc.toLowerCase().includes('bank');

    const whatsappMsg = encodeURIComponent(
      `Hello Vadiva Team, I am trying to pay the Protospark registration fee for Registration ID: ${regId || 'N/A'}. My bank card declined the payment (${errReason || errDesc || 'declined_by_bank'}). Kindly assist me with the payment.`
    );
    const whatsappUrl = `https://wa.me/917200981134?text=${whatsappMsg}`;

    modal.innerHTML = `
      <div style="
        background: #ffffff; border-radius: 16px; max-width: 540px; width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden; border: 2px solid #ef4444;
        max-height: 90vh; display: flex; flex-direction: column;
      ">
        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%); padding: 1.25rem 1.5rem; border-bottom: 1px solid #fecaca; display: flex; align-items: center; gap: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #ef4444; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg style="width: 24px; height: 24px; fill: none; stroke: #ffffff; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #b91c1c;">Payment Issue</div>
            <h3 style="margin: 0.15rem 0 0 0; font-size: 1.2rem; font-weight: 800; color: #991b1b;">
              ${isBankDecline ? 'Declined by Your Issuing Bank' : 'Payment Not Completed'}
            </h3>
          </div>
          <button id="closeFailureModalTopBtn" style="background: transparent; border: none; font-size: 1.5rem; color: #991b1b; cursor: pointer; line-height: 1;">&times;</button>
        </div>

        <div style="padding: 1.25rem 1.5rem; overflow-y: auto; color: #334155; font-size: 0.9rem; line-height: 1.5;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 0.2rem;">Bank Response</div>
            <div style="color: #0f172a; font-weight: 600; font-size: 0.88rem;">${errDesc || 'Your payment was declined by the card issuing bank.'}</div>
            ${errReason ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 0.25rem;">Reason code: <code style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px;">${errReason}</code></div>` : ''}
          </div>

          ${isBankDecline ? `
            <div style="margin-bottom: 1rem;">
              <h4 style="margin: 0 0 0.35rem 0; color: #0f172a; font-size: 0.92rem; font-weight: 700;">Why did this happen?</h4>
              <p style="margin: 0 0 0.75rem 0; color: #475569; font-size: 0.86rem;">
                Under Bank Negara Malaysia and international security rules, <strong>Malaysian debit cards (such as Maybank, CIMB, Public Bank)</strong> have overseas & foreign currency transactions <strong>blocked by default</strong>.
              </p>
              
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.75rem;">
                <div style="font-weight: 800; color: #1e40af; margin-bottom: 0.4rem; font-size: 0.88rem;">
                  💡 How to resolve in 1 minute:
                </div>
                <ol style="margin: 0; padding-left: 1.15rem; color: #1e3a8a; font-size: 0.83rem; line-height: 1.55;">
                  <li><strong>Activate Overseas Usage:</strong> In your <strong>Maybank2u / MAE app</strong>, go to <em>Settings &gt; Cards &gt; Manage Debit Cards &gt; Overseas Card Usage</em>, and turn it <strong>ON / Activate</strong>.</li>
                  <li><strong>Check Daily Limit:</strong> In <em>Purchase Limit / E-Commerce</em>, ensure your daily limit is at least RM 150 (approx $20 USD).</li>
                  <li><strong>Or Use a Credit Card / Wise:</strong> Credit cards, <strong>Wise</strong>, and <strong>BigPay</strong> cards usually do not block cross-border payments.</li>
                </ol>
              </div>
            </div>
          ` : `
            <p style="margin: 0 0 1rem 0; color: #475569; font-size: 0.88rem;">
              Please check your card balance, verify your details, or try an alternative card/payment method.
            </p>
          `}

          <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-top: 1rem;">
            <button id="retryPaymentFailureBtn" style="
              width: 100%; background: #2563eb; color: #ffffff; border: none;
              padding: 0.8rem; border-radius: 8px; font-weight: 700; font-size: 0.92rem;
              cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            ">
              <svg style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2;" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Retry Payment (After Enabling Card)
            </button>

            <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" style="
              width: 100%; background: #10b981; color: #ffffff; text-decoration: none;
              padding: 0.8rem; border-radius: 8px; font-weight: 700; font-size: 0.92rem;
              display: flex; align-items: center; justify-content: center; gap: 0.5rem;
              box-sizing: border-box; text-align: center;
            ">
              <svg style="width: 16px; height: 16px; fill: currentColor;" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.044.072.044.419-.1.824z"/>
              </svg>
              WhatsApp Support (+91 72009 81134)
            </a>

            <button id="closeFailureModalBottomBtn" style="
              width: 100%; background: transparent; border: 1px solid #cbd5e1; color: #64748b;
              padding: 0.65rem; border-radius: 8px; font-weight: 600; font-size: 0.88rem;
              cursor: pointer;
            ">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    `;

    const close = () => {
      modal.style.display = 'none';
    };

    const topCloseBtn = document.getElementById('closeFailureModalTopBtn');
    const bottomCloseBtn = document.getElementById('closeFailureModalBottomBtn');
    const retryBtn = document.getElementById('retryPaymentFailureBtn');

    if (topCloseBtn) topCloseBtn.onclick = close;
    if (bottomCloseBtn) bottomCloseBtn.onclick = close;
    if (retryBtn) {
      retryBtn.onclick = () => {
        close();
        if (typeof window.initiateRazorpayCheckout === 'function') {
          window.initiateRazorpayCheckout(options);
        }
      };
    }

    modal.style.display = 'flex';
  }

  /**
   * Sends payment confirmation data to Google Apps Script backend
   */
  function notifyGoogleAppsScript(details) {
    try {
      const payload = {
        action: 'confirmRazorpayPayment',
        paymentId: details.paymentId,
        orderId: details.orderId,
        registrationId: details.registrationId,
        amount: details.amount,
        status: `Paid (${details.amount || '$20.00 USD'})`
      };

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Google Apps Script notification error:', err));
    } catch (e) {
      console.error('Failed to notify Google Apps Script:', e);
    }
  }

  /**
   * Displays the Payment Confirmation Modal & PDF Download option
   */
  function showReceiptModal(details) {
    let modal = document.getElementById('razorpay-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'razorpay-receipt-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        padding: 1rem; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif;
      `;
      document.body.appendChild(modal);
    }

    const displayAmount = (details.amount || '').replace(/'/g, '₹');

    modal.innerHTML = `
      <div id="receipt-card-container" style="
        background: #ffffff; border-radius: 16px; max-width: 600px; width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; border: 1px solid #e2e8f0;
      ">
        <div id="receipt-pdf-render-area" style="background: #ffffff; padding: 2rem; color: #0f172a;">
          
          <!-- Top Header with Vadiva & ProtoSpark Logos -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.25rem; border-bottom: 2px solid #f1f5f9; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="/assets/logo.png" alt="Vadiva Logo" style="height: 44px; width: auto; max-width: 150px; object-fit: contain;">
            </div>
            <div style="text-align: right;">
              <img src="/assets/protospark-logo.png" alt="ProtoSpark Logo" style="height: 44px; width: auto; max-width: 170px; object-fit: contain;">
            </div>
          </div>

          <!-- Receipt Banner & Status Badge -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 700;">OFFICIAL PAYMENT RECEIPT</div>
              <h2 style="margin: 0.2rem 0 0 0; font-size: 1.35rem; font-weight: 800; color: #ffffff;">${details.businessName || 'Vadiva / ProtoSpark 2026'}</h2>
            </div>
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; padding: 0.4rem 0.85rem; border-radius: 20px; color: #34d399; font-weight: 700; font-size: 0.825rem; display: flex; align-items: center; gap: 0.4rem;">
              <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              VERIFIED & PAID
            </div>
          </div>

          <!-- Transaction Summary Table -->
          <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.85rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem;">
              <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Total Amount Paid</span>
              <span style="font-size: 1.5rem; font-weight: 800; color: #059669;">${displayAmount}</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Payment Status</td>
                <td style="padding: 0.55rem 0; text-align: right; font-weight: 700; color: #059669;">SUCCESSFUL</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Payment Transaction ID</td>
                <td style="padding: 0.55rem 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${details.paymentId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Razorpay Order ID</td>
                <td style="padding: 0.55rem 0; text-align: right; font-family: monospace; font-weight: 600; color: #334155;">${details.orderId}</td>
              </tr>
              ${details.registrationId ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Registration ID</td>
                <td style="padding: 0.55rem 0; text-align: right; font-weight: 700; color: #2563eb;">${details.registrationId}</td>
              </tr>
              ` : ''}
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Transaction Date</td>
                <td style="padding: 0.55rem 0; text-align: right; font-weight: 500; color: #334155;">${details.date}</td>
              </tr>
              ${details.customerName ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Customer Name</td>
                <td style="padding: 0.55rem 0; text-align: right; font-weight: 600; color: #0f172a;">${details.customerName}</td>
              </tr>
              ` : ''}
              ${details.customerEmail ? `
              <tr>
                <td style="padding: 0.55rem 0; color: #64748b; font-weight: 500;">Customer Email</td>
                <td style="padding: 0.55rem 0; text-align: right; font-weight: 500; color: #334155;">${details.customerEmail}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Footer Branding -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.85rem; border-top: 1px dashed #cbd5e1; font-size: 0.8rem; color: #64748b;">
            <div>
              <strong>Vadiva Creative Labs</strong> &bull; ProtoSpark '26
            </div>
            <div>
              Official Automated Receipt
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="background: #f8fafc; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end;">
          <button id="rzp-download-pdf-btn" style="
            background: #2563eb; color: #ffffff; border: none; padding: 0.7rem 1.35rem;
            border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;
            display: inline-flex; align-items: center; gap: 0.5rem; transition: background 0.2s;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          ">
            <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download Receipt (PDF)
          </button>
          <button id="rzp-print-receipt-btn" style="
            background: #ffffff; color: #334155; border: 1px solid #cbd5e1; padding: 0.7rem 1rem;
            border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;
          ">
            Print
          </button>
          <button id="rzp-close-receipt-btn" style="
            background: #e2e8f0; color: #1e293b; border: none; padding: 0.7rem 1rem;
            border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem;
          ">
            Close
          </button>
        </div>
      </div>
    `;

    document.getElementById('rzp-close-receipt-btn').onclick = function() {
      modal.style.display = 'none';
    };

    document.getElementById('rzp-print-receipt-btn').onclick = function() {
      window.print();
    };

    document.getElementById('rzp-download-pdf-btn').onclick = function() {
      downloadPDFReceipt(details);
    };
  }

  /**
   * Generates and downloads a pixel-perfect PDF receipt with Vadiva & ProtoSpark Logos
   */
  async function downloadPDFReceipt(details) {
    const renderArea = document.getElementById('receipt-pdf-render-area');
    if (window.html2canvas && renderArea) {
      try {
        const btn = document.getElementById('rzp-download-pdf-btn');
        if (btn) { btn.innerText = 'Generating PDF...'; btn.disabled = true; }

        const canvas = await window.html2canvas(renderArea, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        if (btn) {
          btn.innerHTML = `
            <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Download Receipt (PDF)
          `;
          btn.disabled = false;
        }

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${details.paymentId}.pdf`);
        return;
      } catch (err) {
        console.error('html2canvas rendering error:', err);
      }
    }
    window.print();
  }

  function loadRazorpaySDK() {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay !== 'undefined') {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Helper function for instant test bypass (closes Razorpay popup, updates Google Sheet, and opens PDF receipt)
   */
  function simulatePaymentSuccess(customDetails = {}) {
    // Remove Razorpay modal iframe if active
    const rzpIframes = document.querySelectorAll('.razorpay-container, iframe[src*="razorpay"]');
    rzpIframes.forEach(el => {
      try { el.remove(); } catch(e) {}
    });

    // Hide payment modal overlay if open
    const modal = document.getElementById('paymentModalOverlay');
    if (modal) modal.style.display = 'none';

    const paymentDetails = {
      paymentId: customDetails.paymentId || customDetails.paymentID || `pay_TEST_${Date.now()}`,
      orderId: customDetails.orderId || customDetails.orderID || `order_TEST_${Date.now()}`,
      amount: customDetails.amount || '₹1,920 INR',
      currency: customDetails.currency || 'INR',
      date: customDetails.date || new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }),
      businessName: customDetails.businessName || 'Vadiva / ProtoSpark 2026',
      customerName: customDetails.customerName || 'Test Student',
      customerEmail: customDetails.customerEmail || 'test@example.com',
      registrationId: customDetails.registrationId || customDetails.registrationID || 'PS2026-TEST'
    };

    notifyGoogleAppsScript(paymentDetails);
    showReceiptModal(paymentDetails);
    return paymentDetails;
  }

  window.initiateRazorpayCheckout = initiateRazorpayCheckout;
  window.showReceiptModal = function(details) {
    if (details) {
      details.paymentId = details.paymentId || details.paymentID || `pay_TEST_${Date.now()}`;
      details.orderId = details.orderId || details.orderID || `order_TEST_${Date.now()}`;
      details.registrationId = details.registrationId || details.registrationID || '';
    }
    return showReceiptModal(details);
  };
  window.detectUserGeoLocation = detectUserGeoLocation;
  window.simulatePaymentSuccess = simulatePaymentSuccess;

})(window);
