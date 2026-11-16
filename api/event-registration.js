/**
 * Vadiva Creative Labs - 2026 Flagship Events API Endpoint (Node.js Serverless Handler)
 * Handles registration, Razorpay order creation, payment signature verification,
 * and registration status lookup for local/Node environments.
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BACKUP_FILE = path.join(__dirname, 'event_registrations_backup.json');
const EVENT_GAS_URL = process.env.EVENT_GAS_URL || 'https://script.google.com/macros/s/AKfycbxK6vANPdnlY8k0c0y7XZFLFzVjBuwX3d3niWDKg1sSfvPSN78k1qMImEBhSLK-uSp35Q/exec';

const EVENT_CATALOG = {
  'kids-maker-fair-2026': {
    id: 'kids-maker-fair-2026',
    tabName: 'Maker Fair',
    title: 'Kids Maker Fair & Repair Mela',
    feeINR: 99,
    amountPaise: 9900,
    prefix: 'KMF26',
    date: '29 November 2026',
    time: '10:30 AM – 3:30 PM',
    venue: 'Santhome, Vadiva Creative Labs'
  },
  'protospark-forge-2026': {
    id: 'protospark-forge-2026',
    tabName: 'ProtoSpark Forge',
    title: 'ProtoSpark Forge',
    feeINR: 6000,
    amountPaise: 600000,
    prefix: 'PSF26',
    date: '26–30 December 2026',
    time: '5 Days, 4 Nights (Sleep Over)',
    venue: 'TVIS, Ponneri'
  },
  'shipwreck-island-2026': {
    id: 'shipwreck-island-2026',
    tabName: 'Shipwreck Island',
    title: 'Shipwreck Island',
    feeINR: 6000,
    amountPaise: 600000,
    prefix: 'SWI26',
    date: '26–30 December 2026',
    time: 'Stay-in Camp',
    venue: 'TVIS, Ponneri'
  }
};

function getEventInfo(key) {
  if (!key) return null;
  const k = key.toLowerCase();
  if (EVENT_CATALOG[k]) return EVENT_CATALOG[k];
  if (k.includes('maker') || k.includes('repair') || k.includes('kmf')) return EVENT_CATALOG['kids-maker-fair-2026'];
  if (k.includes('forge') || k.includes('protospark') || k.includes('psf')) return EVENT_CATALOG['protospark-forge-2026'];
  if (k.includes('shipwreck') || k.includes('island') || k.includes('swi')) return EVENT_CATALOG['shipwreck-island-2026'];
  return null;
}

function generateUID(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}${Math.floor(100 + Math.random() * 900)}`;
}

function getLocalBackup() {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8')) || [];
    }
  } catch (e) {}
  return [];
}

function saveLocalBackup(records) {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (e) {}
}

function forwardToGas(payload) {
  if (!EVENT_GAS_URL || !EVENT_GAS_URL.includes('AKfy')) return;
  try {
    const postData = JSON.stringify(payload);
    const parsed = new URL(EVENT_GAS_URL);
    function follow(url, data) {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location, data);
        }
      });
      req.on('error', () => {});
      req.write(data);
      req.end();
    }
    follow(EVENT_GAS_URL, postData);
  } catch (e) {}
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TJc8h2vN8fM4Nx';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'Hwk3yDWs5Q6BBrSToRfaASd7';

  let body = {};
  if (typeof req.body === 'string') {
    try { body = JSON.parse(req.body); } catch (e) {}
  } else if (req.body) {
    body = req.body;
  }

  const action = req.query?.action || body.action || '';

  // 1. CREATE ORDER
  if (action === 'create-order') {
    const parentName = (body.parentName || '').trim();
    const studentName = (body.studentName || '').trim();
    const schoolName = (body.schoolName || '').trim();
    const email = (body.email || body.emailId || '').trim();
    const city = (body.city || '').trim();
    const eventSlug = (body.event || body.eventSlug || body.eventName || '').trim();

    if (!parentName || !studentName || !schoolName || !email || !city) {
      return res.status(400).json({ success: false, error: 'All five fields are required.' });
    }

    const eventInfo = getEventInfo(eventSlug);
    if (!eventInfo) {
      return res.status(400).json({ success: false, error: 'Invalid event specified.' });
    }

    const participantUID = generateUID(eventInfo.prefix);
    const postData = JSON.stringify({
      amount: eventInfo.amountPaise,
      currency: 'INR',
      receipt: `rcpt_${eventInfo.prefix.toLowerCase()}_${Date.now()}`,
      notes: {
        participantUID,
        eventName: eventInfo.title,
        studentName,
        parentName,
        schoolName,
        city,
        email
      }
    });

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': authHeader
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let responseBody = '';
      apiRes.on('data', chunk => responseBody += chunk);
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          if (apiRes.statusCode >= 200 && apiRes.statusCode < 300 && json.id) {
            const records = getLocalBackup();
            const newRec = {
              participantUID,
              eventName: eventInfo.title,
              eventSlug: eventInfo.id,
              parentName,
              studentName,
              schoolName,
              email,
              city,
              amountINR: eventInfo.feeINR,
              razorpayOrderId: json.id,
              razorpayPaymentId: '',
              registrationStatus: 'Pending',
              paymentStatus: 'Pending',
              createdAt: new Date().toISOString()
            };
            records.push(newRec);
            saveLocalBackup(records);

            // Forward provisional registration to Google Apps Script
            forwardToGas(Object.assign({ action: 'register' }, newRec));

            return res.status(200).json({
              success: true,
              order_id: json.id,
              key_id: keyId,
              amount: eventInfo.amountPaise,
              currency: 'INR',
              participantUID,
              event: eventInfo,
              participant: { parentName, studentName, schoolName, email, city }
            });
          } else {
            return res.status(apiRes.statusCode || 500).json({ success: false, error: json });
          }
        } catch (e) {
          return res.status(500).json({ success: false, error: e.message });
        }
      });
    });

    apiReq.on('error', err => res.status(500).json({ success: false, error: err.message }));
    apiReq.write(postData);
    apiReq.end();
    return;
  }

  // 2. VERIFY PAYMENT
  if (action === 'verify-payment') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, participantUID } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing payment parameters.' });
    }

    const generated = crypto.createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Signature mismatch.' });
    }

    const records = getLocalBackup();
    let updated = null;
    for (let r of records) {
      if ((participantUID && r.participantUID === participantUID) || r.razorpayOrderId === razorpay_order_id) {
        r.paymentStatus = 'Paid';
        r.registrationStatus = 'Confirmed';
        r.razorpayPaymentId = razorpay_payment_id;
        r.paidAt = new Date().toISOString();
        updated = r;
        break;
      }
    }
    saveLocalBackup(records);

    // Forward confirmed payment to Google Apps Script
    forwardToGas({
      action: 'confirmPayment',
      participantUID: updated ? updated.participantUID : participantUID,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      eventName: updated ? updated.eventName : ''
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      participantUID: updated ? updated.participantUID : participantUID,
      paymentId: razorpay_payment_id,
      record: updated
    });
  }

  // 3. CHECK STATUS
  if (action === 'status' || action === 'check-status') {
    const query = (req.query?.uid || req.query?.email || req.query?.q || body.query || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    const records = getLocalBackup();
    const found = records.filter(r => 
      (r.participantUID && r.participantUID.toLowerCase() === query) ||
      (r.email && r.email.toLowerCase() === query)
    );

    if (found.length > 0) {
      return res.status(200).json({ success: true, count: found.length, records: found });
    } else {
      return res.status(404).json({ success: false, error: 'No matching records found.' });
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown action.' });
};
