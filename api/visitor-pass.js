/**
 * Protospark 2026 - Visitor Pass Management API Endpoint (Node.js / Vercel Serverless)
 * Provides identical functionality to api/visitor-pass.php
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PROTOSPARK_GAS_URL = process.env.PROTOSPARK_GAS_URL || 'https://script.google.com/macros/s/AKfycby2JL8sKCi_8W0-53VE8aovpU570RbSYldQkVwq2D1v9QDy_9TbJNlZ2JUy1LhufiBE/exec';
const ADMIN_USERNAME = process.env.PROTOSPARK_ADMIN_USERNAME || 'designthinking@vkp.co.in';
const ADMIN_SECRET = process.env.PROTOSPARK_ADMIN_SECRET || 'protospark_visitor_pass_mgmt_secret_token_2026_vkp_vadiva';
const AUTH_FILE = path.join(__dirname, 'admin_auth.json');
const BACKUP_FILE = path.join(__dirname, 'visitor_registrations_backup.json');

// Memory rate limit cache
const rateLimitMap = new Map();

function checkRateLimit(ip, prefix, maxReqs, windowMs) {
  const key = `${prefix}_${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, first: now };

  if (now - record.first < windowMs) {
    if (record.count >= maxReqs) return false;
    record.count++;
  } else {
    record.count = 1;
    record.first = now;
  }
  rateLimitMap.set(key, record);
  return true;
}

function getStoredCredentials() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      if (parsed && parsed.username && parsed.password_hash) {
        return parsed;
      }
    }
  } catch (e) {}

  // Initial default: Admin@123
  // Salt + SHA-512 PBKDF2 hash
  const salt = 'vadiva_proto_init_salt_2026';
  const hash = crypto.pbkdf2Sync('Admin@123', salt, 50000, 64, 'sha512').toString('hex');
  return {
    username: ADMIN_USERNAME,
    salt: salt,
    password_hash: hash,
    is_initial: true
  };
}

function verifyPassword(inputPassword, creds) {
  if (creds.is_initial && inputPassword === 'Admin@123') return true;
  if (!creds.salt) return false;
  const hash = crypto.pbkdf2Sync(inputPassword, creds.salt, 50000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(creds.password_hash));
}

function generateSessionToken(username, mustChange) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: username,
    role: 'admin',
    mustChangePassword: mustChange,
    exp: Math.floor(Date.now() / 1000) + (4 * 3600)
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function validateSessionToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, sig] = parts;
  const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (expected !== sig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() / 1000 > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function fetchGas(postPayload, queryParam = '') {
  return new Promise((resolve, reject) => {
    let targetUrl = PROTOSPARK_GAS_URL;
    if (queryParam) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryParam;
    }

    const parsed = new URL(targetUrl);
    const postData = postPayload ? JSON.stringify(postPayload) : null;

    function doRequest(reqUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));

      const u = new URL(reqUrl);
      const isHttps = u.protocol === 'https:';
      const client = isHttps ? https : http;

      const opts = {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search,
        method: postData ? 'POST' : 'GET',
        headers: postData ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        } : {}
      };

      const req = client.request(opts, (res) => {
        if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
          // Follow redirect with GET
          return doRequest(res.headers.location, redirects + 1);
        }

        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsedJson = JSON.parse(body);
            resolve(parsedJson);
          } catch (e) {
            resolve({ raw: body, error: 'Failed to parse JSON from GAS' });
          }
        });
      });

      req.on('error', err => reject(err));
      if (postData) req.write(postData);
      req.end();
    }

    doRequest(targetUrl);
  });
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

  // Parse body
  let body = {};
  if (req.body) {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } else if (req.method === 'POST') {
    body = await new Promise((resolve) => {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => {
        try { resolve(JSON.parse(b)); } catch (e) { resolve({}); }
      });
    });
  }

  const action = parsedUrl.searchParams.get('action') || body.action || '';
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (body.token || parsedUrl.searchParams.get('token') || '');

  // 1. ADMIN LOGIN
  if (action === 'login') {
    if (!checkRateLimit(ip, 'login', 5, 15 * 60 * 1000)) {
      res.statusCode = 429;
      return res.end(JSON.stringify({ success: false, error: 'Too many login attempts. Please wait 15 minutes.' }));
    }

    const { username, password } = body;
    const creds = getStoredCredentials();

    if (!username || !password || username.toLowerCase() !== creds.username.toLowerCase() || !verifyPassword(password, creds)) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, error: 'Invalid credentials. Please verify and try again.' }));
    }

    const mustChange = !!creds.is_initial;
    const token = generateSessionToken(creds.username, mustChange);

    return res.end(JSON.stringify({
      success: true,
      token,
      mustChangePassword: mustChange,
      user: { username: creds.username, role: 'Administrator' }
    }));
  }

  // 2. CHANGE PASSWORD
  if (action === 'change-password') {
    const session = validateSessionToken(bearerToken);
    if (!session) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized session.' }));
    }

    const { currentPassword, newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'New password must be at least 8 characters long.' }));
    }

    const creds = getStoredCredentials();
    if (!verifyPassword(currentPassword, creds)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Current password does not match.' }));
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 50000, 64, 'sha512').toString('hex');

    const updatedCreds = {
      username: creds.username,
      salt: newSalt,
      password_hash: newHash,
      is_initial: false,
      updated_at: new Date().toISOString()
    };

    try { fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedCreds, null, 2)); } catch (e) {}

    const newToken = generateSessionToken(creds.username, false);
    return res.end(JSON.stringify({
      success: true,
      message: 'Password changed successfully.',
      token: newToken
    }));
  }

  // 3. LOGOUT
  if (action === 'logout') {
    return res.end(JSON.stringify({ success: true, message: 'Logged out successfully.' }));
  }

  // 4. VERIFY PASS (PUBLIC)
  if (action === 'verify') {
    const visitorId = parsedUrl.searchParams.get('id') || body.visitorId;
    if (!visitorId) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Visitor ID is required.' }));
    }

    try {
      const gasResult = await fetchGas(null, `action=verifyVisitorPass&id=${encodeURIComponent(visitorId)}`);
      if (gasResult && gasResult.status === 'success' && gasResult.visitorId) {
        res.statusCode = 200;
        return res.end(JSON.stringify({
          success: true,
          valid: gasResult.valid,
          visitor: {
            visitorId: gasResult.visitorId,
            visitorName: gasResult.visitorName,
            schoolName: gasResult.schoolName,
            visitorType: gasResult.visitorType,
            groupReference: gasResult.groupReference || '',
            registrationDate: gasResult.registrationDate || '',
            passStatus: gasResult.passStatus || 'Generated',
            registrationStatus: gasResult.registrationStatus || 'Confirmed'
          }
        }));
      }
    } catch (e) {}

    res.statusCode = 404;
    return res.end(JSON.stringify({ success: false, valid: false, error: 'Visitor Pass not found or cancelled.' }));
  }

  // 5. LIST PASSES (PROTECTED)
  if (action === 'list') {
    const session = validateSessionToken(bearerToken);
    if (!session) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized. Admin credentials required.' }));
    }

    try {
      const gasResult = await fetchGas(null, 'action=getVisitorPasses');
      if (gasResult && gasResult.status === 'success') {
        return res.end(JSON.stringify({
          success: true,
          count: gasResult.count || (gasResult.records ? gasResult.records.length : 0),
          records: gasResult.records || []
        }));
      }
    } catch (e) {}

    // Fallback to local backup
    let local = [];
    try {
      if (fs.existsSync(BACKUP_FILE)) local = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    } catch (e) {}

    return res.end(JSON.stringify({
      success: true,
      count: local.length,
      records: local,
      source: 'local_cache'
    }));
  }

  // 6. UPDATE STATUS (PROTECTED)
  if (action === 'update-status') {
    const session = validateSessionToken(bearerToken);
    if (!session) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized. Admin credentials required.' }));
    }

    const { visitorId, status } = body;
    if (!visitorId) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Visitor ID required.' }));
    }

    try {
      const gasResult = await fetchGas({
        action: 'updateVisitorPassStatus',
        visitorId,
        registrationStatus: status || 'Confirmed'
      });
      return res.end(JSON.stringify({ success: true, visitorId, status, backend: gasResult }));
    } catch (e) {
      return res.end(JSON.stringify({ success: true, visitorId, status, backend: { error: e.message } }));
    }
  }

  // 7. PUBLIC REGISTRATION
  if (action === 'register' || req.method === 'POST') {
    if (!checkRateLimit(ip, 'register', 12, 60 * 1000)) {
      res.statusCode = 429;
      return res.end(JSON.stringify({ success: false, error: 'Rate limit reached. Please wait a moment.' }));
    }

    // Honeypot check
    if (body.website_hp || body.hp_field) {
      return res.end(JSON.stringify({ success: true, message: 'Registration received.' }));
    }

    const isTeacher = !!body.isTeacher;
    const errors = [];

    if (isTeacher) {
      if (!body.teacherName) errors.push('Teacher name is required.');
      if (!body.schoolName) errors.push('School name is required.');
      if (!body.teacherEmail || !body.teacherEmail.includes('@')) errors.push('Valid teacher email is required.');
      if (!body.teacherContactNumber || body.teacherContactNumber.length < 8) errors.push('Valid teacher contact number is required.');
      if (!Array.isArray(body.students) || body.students.length === 0) {
        errors.push('At least one student must be registered.');
      } else if (body.students.length > 50) {
        errors.push('Maximum 50 students allowed per registration session.');
      } else {
        body.students.forEach((st, i) => {
          if (!st.studentName) errors.push(`Student #${i + 1} name is required.`);
        });
      }
    } else {
      if (!body.fullName) errors.push('Full name is required.');
      if (!body.schoolName) errors.push('School name is required.');
      if (!body.email || !body.email.includes('@')) errors.push('Valid email address is required.');
      if (!body.contactNumber || body.contactNumber.length < 8) errors.push('Valid contact number is required.');
    }

    if (errors.length > 0) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: errors.join(' '), details: errors }));
    }

    try {
      const gasPayload = {
        action: 'registerVisitorPass',
        isTeacher: isTeacher,
        visitorType: isTeacher ? 'Teacher' : 'Individual Visitor',
        ...body
      };

      const gasRes = await fetchGas(gasPayload);

      if (gasRes && gasRes.status === 'success') {
        // Save local backup
        try {
          let existing = [];
          if (fs.existsSync(BACKUP_FILE)) existing = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
          if (gasRes.records) existing.push(...gasRes.records);
          fs.writeFileSync(BACKUP_FILE, JSON.stringify(existing, null, 2));
        } catch (e) {}

        return res.end(JSON.stringify({
          success: true,
          message: 'Registration completed successfully.',
          groupId: gasRes.groupId || '',
          totalRegistered: gasRes.totalRegistered || (gasRes.records ? gasRes.records.length : 0),
          records: gasRes.records || []
        }));
      } else {
        res.statusCode = 502;
        return res.end(JSON.stringify({
          success: false,
          error: (gasRes && gasRes.message) || 'Error from Google Sheets backend'
        }));
      }
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ success: false, error: 'Backend error: ' + err.message }));
    }
  }

  res.statusCode = 400;
  res.end(JSON.stringify({ success: false, error: 'Unknown action or invalid request.' }));
};
