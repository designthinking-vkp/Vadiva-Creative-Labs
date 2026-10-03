/**
 * Vadiva's Tech & Design Fest 2.0 - Lead Generation Backend
 * Google Apps Script for Google Sheet Integration
 *
 * Spreadsheet ID: 1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc
 *
 * Column Structure (A to V):
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
const SHEET_NAME = 'Leads'; // Will fallback to active/first sheet if 'Leads' not found

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: "Vadiva's Tech & Design Fest 2.0 Lead Endpoint",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for concurrent submissions
    lock.waitLock(10000);

    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Basic Honeypot / Spam Protection
    if (data.website_url_hp || data.honeypot) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Registration received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Required fields validation
    const participantName = (data.participantName || '').trim();
    const parentCaretakerName = (data.parentCaretakerName || '').trim();
    const studyLevel = (data.studyLevel || '').trim();
    const gradeOrCollegeYear = (data.gradeOrCollegeYear || '').trim();
    const institutionName = (data.institutionName || '').trim();
    const city = (data.city || '').trim();
    const contactNumber = (data.contactNumber || '').trim().replace(/\D/g, '');
    const whatsappNumber = (data.whatsappNumber || '').trim().replace(/\D/g, '');
    const email = (data.email || '').trim().toLowerCase();

    if (!participantName || !parentCaretakerName || !studyLevel || !gradeOrCollegeYear || !institutionName || !city || !contactNumber || !email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required registration fields'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate 10-digit Indian mobile number
    if (!/^[6-9]\d{9}$/.test(contactNumber)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid 10-digit Indian contact number'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Open Spreadsheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getActiveSheet();
    }

    // Setup headers if sheet is brand new
    if (sheet.getLastRow() === 0) {
      const headers = [
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

    // Duplicate Check: Check Contact Number + Participant Name combination in last 1000 rows
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const checkRows = Math.min(1000, lastRow - 1);
      const startRow = Math.max(2, lastRow - checkRows + 1);
      const existingData = sheet.getRange(startRow, 2, checkRows, 7).getValues(); // Cols B to H (Name to Contact)

      for (let i = 0; i < existingData.length; i++) {
        const existingName = String(existingData[i][0] || '').trim().toLowerCase();
        const existingContact = String(existingData[i][6] || '').trim().replace(/\D/g, '');

        if (existingName === participantName.toLowerCase() && existingContact === contactNumber) {
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            isDuplicate: true,
            message: 'We already received a registration for this participant. Our team will contact you shortly.'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Generate India Standard Time (IST) Timestamp
    const now = new Date();
    const istTimestamp = Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');

    // Tracking & UTM parameters
    const leadSource = (data.leadSource || 'Meta Ads').trim();
    const campaign = (data.campaign || data.utmCampaign || '').trim();
    const adSet = (data.adSet || '').trim();
    const ad = (data.ad || '').trim();
    const utmSource = (data.utmSource || '').trim();
    const utmMedium = (data.utmMedium || '').trim();
    const utmCampaign = (data.utmCampaign || '').trim();
    const utmContent = (data.utmContent || '').trim();
    const utmTerm = (data.utmTerm || '').trim();
    const fbclid = (data.fbclid || '').trim();
    const landingPage = (data.landingPage || 'https://vadivacreativelabs.com/techfestregistration').trim();
    const submissionStatus = 'Verified Lead';

    // Prepare row data (Columns A to V)
    const row = [
      istTimestamp,           // A: Timestamp
      participantName,        // B: Participant Name
      parentCaretakerName,    // C: Parent / Caretaker Name
      studyLevel,             // D: Current Level of Study
      gradeOrCollegeYear,     // E: Grade / College Year
      institutionName,        // F: Institution Name
      city,                   // G: City
      contactNumber,          // H: Contact Number
      whatsappNumber || '-',  // I: WhatsApp Number
      email,                  // J: Email ID
      leadSource,             // K: Lead Source
      campaign,               // L: Campaign
      adSet,                  // M: Ad Set
      ad,                     // N: Ad
      utmSource,              // O: UTM Source
      utmMedium,              // P: UTM Medium
      utmCampaign,            // Q: UTM Campaign
      utmContent,             // R: UTM Content
      utmTerm,                // S: UTM Term
      fbclid,                 // T: FBCLID
      landingPage,            // U: Landing Page
      submissionStatus        // V: Submission Status
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Lead submitted successfully',
      participant: participantName,
      timestamp: istTimestamp
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to record lead. Please try again.'
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
