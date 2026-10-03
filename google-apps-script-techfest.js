/**
 * Vadiva's Tech & Design Fest 2.0 - Lead Generation Backend
 * Google Apps Script for Google Sheet Integration
 *
 * Spreadsheet ID: 1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc
 *
 * Column Structure (A to V - 22 Columns):
 * A - Timestamp (IST)
 * B - Participant Name
 * C - Parent / Caretaker Name
 * D - Current Level of Study
 * E - Grade / College Year
 * F - Institution Name
 * G - City
 * H - Contact Number
 * I - WhatsApp Number
 * J - Email ID
 * K - Lead Source
 * L - Campaign
 * M - Ad Set
 * N - Ad
 * O - UTM Source
 * P - UTM Medium
 * Q - UTM Campaign
 * R - UTM Content
 * S - UTM Term
 * T - FBCLID
 * U - Landing Page
 * V - Submission Status
 */

const SPREADSHEET_ID = '1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc';

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: "Vadiva's Tech & Design Fest 2.0 Lead API",
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function parseFormString(str) {
  var res = {};
  if (!str) return res;
  try {
    var pairs = str.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      if (pair[0]) {
        res[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
      }
    }
  } catch (err) {
    Logger.log("parseFormString error: " + err.toString());
  }
  return res;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = parseFormString(e.postData.contents);
      }
    }
    
    if (e && e.parameter) {
      for (var key in e.parameter) {
        if (data[key] === undefined || data[key] === "") {
          data[key] = e.parameter[key];
        }
      }
    }

    // Honeypot spam trap
    if (data.website_url_hp || data.honeypot || data.hp_field) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Registration received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Required fields extraction & sanitization
    var participantName     = String(data.participantName || '').trim();
    var parentCaretakerName = String(data.parentCaretakerName || '').trim();
    var studyLevel          = String(data.studyLevel || '').trim();
    var gradeOrCollegeYear  = String(data.gradeOrCollegeYear || '').trim();
    var institutionName     = String(data.institutionName || '').trim();
    var city                = String(data.city || '').trim();
    var contactNumber       = String(data.contactNumber || '').trim().replace(/\D/g, '');
    var whatsappNumber      = String(data.whatsappNumber || '').trim().replace(/\D/g, '');
    var email               = String(data.email || '').trim().toLowerCase();

    if (!participantName || !parentCaretakerName || !studyLevel || !gradeOrCollegeYear || !institutionName || !city || !contactNumber || !email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required registration fields'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Open Target Spreadsheet
    var ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Could not access spreadsheet'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = ss.getSheetByName('Leads') || ss.getSheetByName('Submissions') || ss.getSheets()[0];

    // Setup headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        'Timestamp',
        'Participant Name',
        'Parent / Caretaker Name',
        'Current Level of Study',
        'Grade / College Year',
        'Institution Name',
        'City',
        'Contact Number',
        'WhatsApp Number',
        'Email ID',
        'Lead Source',
        'Campaign',
        'Ad Set',
        'Ad',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign',
        'UTM Content',
        'UTM Term',
        'FBCLID',
        'Landing Page',
        'Submission Status'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0A192F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    // Duplicate Check: Check Contact Number + Participant Name combination
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var checkRows = Math.min(1000, lastRow - 1);
      var startRow = Math.max(2, lastRow - checkRows + 1);
      var existingData = sheet.getRange(startRow, 2, checkRows, 7).getValues();

      var normContact = contactNumber.length > 10 ? contactNumber.slice(-10) : contactNumber;

      for (var i = 0; i < existingData.length; i++) {
        var existingName = String(existingData[i][0] || '').trim().toLowerCase();
        var existingPhone = String(existingData[i][6] || '').trim().replace(/\D/g, '');
        if (existingPhone.length > 10) existingPhone = existingPhone.slice(-10);

        if (existingName === participantName.toLowerCase() && existingPhone === normContact) {
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            isDuplicate: true,
            message: 'We already received a registration for this participant. Our team will contact you shortly.'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Timestamp in India Standard Time (IST)
    var now = new Date();
    var istTimestamp = Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');

    // Tracking & UTM parameters
    var leadSource  = String(data.leadSource || data.utmSource || 'Meta Ads').trim();
    var campaign    = String(data.campaign || data.utmCampaign || '').trim();
    var adSet       = String(data.adSet || '').trim();
    var ad          = String(data.ad || '').trim();
    var utmSource   = String(data.utmSource || data.utm_source || '').trim();
    var utmMedium   = String(data.utmMedium || data.utm_medium || '').trim();
    var utmCampaign = String(data.utmCampaign || data.utm_campaign || '').trim();
    var utmContent  = String(data.utmContent || data.utm_content || '').trim();
    var utmTerm     = String(data.utmTerm || data.utm_term || '').trim();
    var fbclid      = String(data.fbclid || '').trim();
    var landingPage = String(data.landingPage || 'https://vadivacreativelabs.com/techfestregistration').trim();
    var submissionStatus = 'Verified Lead';

    // Prepare row (A to V)
    var row = [
      istTimestamp,           // A
      participantName,        // B
      parentCaretakerName,    // C
      studyLevel,             // D
      gradeOrCollegeYear,     // E
      institutionName,        // F
      city,                   // G
      contactNumber,          // H
      whatsappNumber || '-',  // I
      email,                  // J
      leadSource,             // K
      campaign,               // L
      adSet,                  // M
      ad,                     // N
      utmSource,              // O
      utmMedium,              // P
      utmCampaign,            // Q
      utmContent,             // R
      utmTerm,                // S
      fbclid,                 // T
      landingPage,            // U
      submissionStatus        // V
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Lead submitted successfully',
      participant: participantName,
      timestamp: istTimestamp
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to record lead: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
