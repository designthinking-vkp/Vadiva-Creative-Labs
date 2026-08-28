const https = require('https');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TJc8h2vN8fM4Nx';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'Hwk3yDWs5Q6BBrSToRfaASd7';

  try {
    let bodyData = {};
    if (typeof req.body === 'string') {
      try { bodyData = JSON.parse(req.body); } catch (e) { bodyData = {}; }
    } else if (req.body) {
      bodyData = req.body;
    }

    // Default amount: 192000 paise = ₹1,920 INR / 2000 cents = $20 USD
    const currency = bodyData.currency || 'INR';
    const amount = bodyData.amount !== undefined ? bodyData.amount : (currency === 'USD' ? 2000 : 192000);
    const receipt = bodyData.receipt || `rcpt_${Date.now()}`;
    const notes = bodyData.notes || {};

    const postData = JSON.stringify({
      amount: parseInt(amount, 10),
      currency: currency,
      receipt: receipt,
      notes: notes
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
      apiRes.on('data', (chunk) => { responseBody += chunk; });
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
            return res.status(200).json({ success: true, order: json, key_id: keyId });
          } else {
            return res.status(apiRes.statusCode).json({ success: false, error: json });
          }
        } catch (e) {
          return res.status(500).json({ error: 'Failed to parse Razorpay API response' });
        }
      });
    });

    apiReq.on('error', (e) => {
      return res.status(500).json({ error: e.message });
    });

    apiReq.write(postData);
    apiReq.end();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
