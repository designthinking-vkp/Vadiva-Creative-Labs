/**
 * Vadiva Creative Labs - Event Registration & Management Backend
 * Google Apps Script for Spreadsheet ID: 1U3I2U_xMa0ChSSxCbYTrzlAV2f2wjBWZ3P6sF4RufF0
 * 
 * Target Events:
 * 1. Kids Maker Fair & Repair Mela (₹99)
 * 2. ProtoSpark Forge (₹6,000)
 * 3. Shipwreck Island (₹6,000)
 * 
 * Deployment Instructions:
 * 1. Open Spreadsheet: https://docs.google.com/spreadsheets/d/1U3I2U_xMa0ChSSxCbYTrzlAV2f2wjBWZ3P6sF4RufF0/edit
 * 2. In Google Sheets menu, click Extensions > Apps Script.
 * 3. Replace all existing text in Code.gs with this entire script.
 * 4. Run `setupSpreadsheet()` once from the editor to automatically format all 4 tabs.
 * 5. Click Deploy > New Deployment.
 * 6. Select Type: "Web App".
 * 7. Description: "Vadiva Event Registration API".
 * 8. Execute as: "Me".
 * 9. Who has access: "Anyone".
 * 10. Click Deploy and copy the Web App URL.
 * 11. Paste that URL into .env (EVENT_GAS_URL) and api/config.php.
 */

var SPREADSHEET_ID = "1U3I2U_xMa0ChSSxCbYTrzlAV2f2wjBWZ3P6sF4RufF0";

var TAB_CONFIG = {
  makerFair: {
    name: "Maker Fair",
    fee: 99,
    prefix: "KMF26",
    columns: ["Parent Name", "Student Name", "School Name", "Email ID", "City", "Participant UID", "Registration Status", "Payment Status", "Registration Date"]
  },
  protoSpark: {
    name: "ProtoSpark Forge",
    fee: 6000,
    prefix: "PSF26",
    columns: ["Parent Name", "Student Name", "School Name", "Email ID", "City", "Participant UID", "Registration Status", "Payment Status", "Registration Date"]
  },
  shipwreckIsland: {
    name: "Shipwreck Island",
    fee: 6000,
    prefix: "SWI26",
    columns: ["Parent Name", "Student Name", "School Name", "Email ID", "City", "Participant UID", "Registration Status", "Payment Status", "Registration Date"]
  },
  payments: {
    name: "Payments",
    columns: ["Registration ID", "Participant UID", "Event Name", "Student Name", "Email ID", "Amount", "Currency", "Razorpay Order ID", "Razorpay Payment ID", "Payment Status", "Payment Date & Time"]
  }
};

/**
 * Helper to obtain the active spreadsheet safely
 */
function getTargetSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    Logger.log("getActiveSpreadsheet fallback: " + e.toString());
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Setup function: Creates 4 tabs with required headers, styling, freeze rows, column widths & conditional formatting.
 * Preserves all existing records!
 */
function setupSpreadsheet() {
  var ss = getTargetSpreadsheet();
  var tabs = [TAB_CONFIG.makerFair, TAB_CONFIG.protoSpark, TAB_CONFIG.shipwreckIsland, TAB_CONFIG.payments];
  
  tabs.forEach(function(tab) {
    var sheet = ss.getSheetByName(tab.name);
    if (!sheet) {
      sheet = ss.insertSheet(tab.name);
    }
    
    // Check if headers exist
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var cols = tab.columns;
    
    if (lastRow === 0) {
      sheet.appendRow(cols);
    } else {
      // Ensure header row matches
      var headerRange = sheet.getRange(1, 1, 1, cols.length);
      headerRange.setValues([cols]);
    }
    
    // Style Header Row (Dark blue background #1E3A8A, White Bold Text, Centered)
    var header = sheet.getRange(1, 1, 1, cols.length);
    header.setBackground("#1E3A8A");
    header.setFontColor("#FFFFFF");
    header.setFontWeight("bold");
    header.setFontFamily("Arial");
    header.setFontSize(11);
    header.setHorizontalAlignment("center");
    header.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);
    
    // Freeze first row
    sheet.setFrozenRows(1);
    
    // Set auto / readable column widths
    for (var c = 1; c <= cols.length; c++) {
      sheet.setColumnWidth(c, 180);
    }
    
    // Enable filter on header if none exists
    try {
      var filter = sheet.getFilter();
      if (!filter) {
        sheet.getRange(1, 1, Math.max(lastRow, 2), cols.length).createFilter();
      }
    } catch (eFilter) {
      Logger.log("Filter notice: " + eFilter.toString());
    }
  });

  applyStatusConditionalFormatting(ss);
  Logger.log("Spreadsheet initialized successfully with 4 organized tabs.");
  return { success: true, message: "Spreadsheet formatted and organized successfully." };
}

/**
 * Applies color coding rules for Payment Status:
 * Paid = Green, Pending = Orange, Failed = Red, Cancelled = Grey, Refunded = Purple
 */
function applyStatusConditionalFormatting(ss) {
  var tabNames = [TAB_CONFIG.makerFair.name, TAB_CONFIG.protoSpark.name, TAB_CONFIG.shipwreckIsland.name, TAB_CONFIG.payments.name];
  
  tabNames.forEach(function(tName) {
    var sheet = ss.getSheetByName(tName);
    if (!sheet) return;
    
    var statusCol = (tName === TAB_CONFIG.payments.name) ? 10 : 8; // Column J or Column H
    var range = sheet.getRange(2, statusCol, 999, 1);
    
    var rules = [];
    
    // Paid: Green #DCFCE7, Text #15803D
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Paid")
      .setBackground("#DCFCE7")
      .setFontColor("#15803D")
      .setRanges([range])
      .build());
      
    // Pending: Orange #FFEDD5, Text #C2410C
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Pending")
      .setBackground("#FFEDD5")
      .setFontColor("#C2410C")
      .setRanges([range])
      .build());
      
    // Failed: Red #FEE2E2, Text #B91C1C
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Failed")
      .setBackground("#FEE2E2")
      .setFontColor("#B91C1C")
      .setRanges([range])
      .build());
      
    // Cancelled: Grey #F1F5F9, Text #475569
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Cancelled")
      .setBackground("#F1F5F9")
      .setFontColor("#475569")
      .setRanges([range])
      .build());
      
    // Refunded: Purple #F3E8FF, Text #7E22CE
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Refunded")
      .setBackground("#F3E8FF")
      .setFontColor("#7E22CE")
      .setRanges([range])
      .build());
      
    sheet.setConditionalFormatRules(rules);
  });
}

/**
 * Generates an event-specific participant UID
 */
function generateUID(prefix) {
  var rand = Math.floor(1000 + Math.random() * 9000);
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  var code = "";
  for (var i = 0; i < 2; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + "-" + code + rand;
}

/**
 * Resolves event key from tab name or slug
 */
function resolveEventConfig(eventIdentifier) {
  if (!eventIdentifier) return null;
  var id = eventIdentifier.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (id.indexOf("maker") !== -1 || id.indexOf("repair") !== -1 || id.indexOf("kmf") !== -1) {
    return TAB_CONFIG.makerFair;
  }
  if (id.indexOf("forge") !== -1 || id.indexOf("protospark") !== -1 || id.indexOf("psf") !== -1) {
    return TAB_CONFIG.protoSpark;
  }
  if (id.indexOf("shipwreck") !== -1 || id.indexOf("island") !== -1 || id.indexOf("swi") !== -1) {
    return TAB_CONFIG.shipwreckIsland;
  }
  return null;
}

/**
 * Appends participant to event tab and pending payment to Payments tab
 */
function registerParticipant(payload) {
  var ss = getTargetSpreadsheet();
  var evt = resolveEventConfig(payload.eventName || payload.event);
  if (!evt) {
    return { success: false, error: "Invalid event specified: " + (payload.eventName || "") };
  }

  var sheet = ss.getSheetByName(evt.name);
  if (!sheet) {
    setupSpreadsheet();
    sheet = ss.getSheetByName(evt.name);
  }

  var uid = payload.participantUID || generateUID(evt.prefix);
  var now = new Date();
  var dateStr = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");

  var parentName = (payload.parentName || "").trim();
  var studentName = (payload.studentName || "").trim();
  var schoolName = (payload.schoolName || "").trim();
  var email = (payload.email || payload.emailId || "").trim();
  var city = (payload.city || "").trim();
  var regStatus = payload.registrationStatus || "Pending";
  var paymentStatus = payload.paymentStatus || "Pending";

  // Check duplicate UID
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][5] === uid) {
      // Return existing
      return {
        success: true,
        participantUID: uid,
        eventName: evt.name,
        studentName: studentName,
        paymentStatus: data[r][7],
        registrationStatus: data[r][6],
        isExisting: true
      };
    }
  }

  // Row columns: Parent Name, Student Name, School Name, Email ID, City, Participant UID, Registration Status, Payment Status, Registration Date
  var newRow = [parentName, studentName, schoolName, email, city, uid, regStatus, paymentStatus, dateStr];
  sheet.appendRow(newRow);

  // Central Payments Tab entry
  var paySheet = ss.getSheetByName(TAB_CONFIG.payments.name);
  if (paySheet) {
    var regId = "REG-" + Utilities.formatDate(now, "Asia/Kolkata", "yyMMdd") + "-" + uid;
    var amount = evt.fee;
    var orderId = payload.razorpayOrderId || "";
    var paymentId = payload.razorpayPaymentId || "";
    
    // Columns: Registration ID, Participant UID, Event Name, Student Name, Email ID, Amount, Currency, Razorpay Order ID, Razorpay Payment ID, Payment Status, Payment Date & Time
    paySheet.appendRow([regId, uid, evt.name, studentName, email, amount, "INR", orderId, paymentId, paymentStatus, dateStr]);
  }

  return {
    success: true,
    participantUID: uid,
    eventName: evt.name,
    amount: evt.fee,
    currency: "INR",
    studentName: studentName,
    parentName: parentName,
    schoolName: schoolName,
    city: city,
    email: email,
    registrationStatus: regStatus,
    paymentStatus: paymentStatus,
    date: dateStr
  };
}

/**
 * Confirms payment in both Event Tab and Payments Tab
 */
function confirmPayment(payload) {
  var ss = getTargetSpreadsheet();
  var uid = (payload.participantUID || payload.uid || "").trim();
  var orderId = payload.razorpayOrderId || payload.orderId || "";
  var paymentId = payload.razorpayPaymentId || payload.paymentId || "";
  var paymentStatus = "Paid";
  var regStatus = "Confirmed";
  var now = new Date();
  var dateStr = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");

  var foundRecord = null;
  var eventTabs = [TAB_CONFIG.makerFair.name, TAB_CONFIG.protoSpark.name, TAB_CONFIG.shipwreckIsland.name];

  eventTabs.forEach(function(tName) {
    var sheet = ss.getSheetByName(tName);
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][5]).trim() === uid) {
        // Update Registration Status (Col G = 7) and Payment Status (Col H = 8)
        sheet.getRange(r + 1, 7).setValue(regStatus);
        sheet.getRange(r + 1, 8).setValue(paymentStatus);
        foundRecord = {
          eventName: tName,
          parentName: data[r][0],
          studentName: data[r][1],
          schoolName: data[r][2],
          email: data[r][3],
          city: data[r][4],
          participantUID: uid,
          registrationStatus: regStatus,
          paymentStatus: paymentStatus,
          date: data[r][8]
        };
        break;
      }
    }
  });

  // Update Payments tab
  var paySheet = ss.getSheetByName(TAB_CONFIG.payments.name);
  if (paySheet) {
    var pData = paySheet.getDataRange().getValues();
    var pFound = false;
    for (var pr = 1; pr < pData.length; pr++) {
      if (String(pData[pr][1]).trim() === uid) {
        paySheet.getRange(pr + 1, 8).setValue(orderId || pData[pr][7]);
        paySheet.getRange(pr + 1, 9).setValue(paymentId);
        paySheet.getRange(pr + 1, 10).setValue(paymentStatus);
        paySheet.getRange(pr + 1, 11).setValue(dateStr);
        pFound = true;
        break;
      }
    }
    if (!pFound && foundRecord) {
      var evtCfg = resolveEventConfig(foundRecord.eventName);
      var regId = "REG-" + Utilities.formatDate(now, "Asia/Kolkata", "yyMMdd") + "-" + uid;
      paySheet.appendRow([regId, uid, foundRecord.eventName, foundRecord.studentName, foundRecord.email, evtCfg ? evtCfg.fee : 0, "INR", orderId, paymentId, paymentStatus, dateStr]);
    }
  }

  return {
    success: true,
    participantUID: uid,
    paymentId: paymentId,
    orderId: orderId,
    record: foundRecord
  };
}

/**
 * Look up registration status by UID or Email
 */
function getRegistrationStatus(query) {
  var ss = getTargetSpreadsheet();
  var q = (query || "").trim().toLowerCase();
  if (!q) return { success: false, error: "Query is required" };

  var results = [];
  var eventTabs = [
    { config: TAB_CONFIG.makerFair, date: "29 November 2026", time: "10:30 AM – 3:30 PM", venue: "Santhome, Vadiva Creative Labs", fee: "₹99" },
    { config: TAB_CONFIG.protoSpark, date: "26–30 December 2026", time: "5 Days, 4 Nights", venue: "TVIS, Ponneri", fee: "₹6,000" },
    { config: TAB_CONFIG.shipwreckIsland, date: "26–30 December 2026", time: "Stay-in Camp", venue: "TVIS, Ponneri", fee: "₹6,000" }
  ];

  eventTabs.forEach(function(item) {
    var sheet = ss.getSheetByName(item.config.name);
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      var rowUid = String(data[r][5] || "").trim().toLowerCase();
      var rowEmail = String(data[r][3] || "").trim().toLowerCase();
      var rowStudent = String(data[r][1] || "").trim().toLowerCase();
      
      if (rowUid === q || rowEmail === q || (q.length > 4 && rowStudent.indexOf(q) !== -1)) {
        results.push({
          eventName: item.config.name,
          parentName: data[r][0],
          studentName: data[r][1],
          schoolName: data[r][2],
          email: data[r][3],
          city: data[r][4],
          participantUID: data[r][5],
          registrationStatus: data[r][6],
          paymentStatus: data[r][7],
          registrationDate: data[r][8],
          eventDate: item.date,
          eventTime: item.time,
          eventVenue: item.venue,
          eventFee: item.fee
        });
      }
    }
  });

  return {
    success: results.length > 0,
    count: results.length,
    records: results
  };
}

/**
 * HTTP GET Handler (CORS friendly)
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || "";
  var res = {};

  try {
    if (action === "setup") {
      res = setupSpreadsheet();
    } else if (action === "status" || action === "check") {
      res = getRegistrationStatus(params.uid || params.email || params.q);
    } else {
      res = {
        status: "online",
        service: "Vadiva Creative Labs Event Backend API",
        spreadsheetId: SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    res = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST Handler (CORS friendly)
 */
function doPost(e) {
  var payload = {};
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
  } catch (parseErr) {
    payload = e.parameter || {};
  }

  var action = payload.action || (e.parameter ? e.parameter.action : "");
  var res = {};

  try {
    if (action === "register") {
      res = registerParticipant(payload);
    } else if (action === "confirmPayment") {
      res = confirmPayment(payload);
    } else if (action === "status" || action === "check") {
      res = getRegistrationStatus(payload.uid || payload.email || payload.q);
    } else if (action === "setup") {
      res = setupSpreadsheet();
    } else {
      res = { success: false, error: "Invalid action: " + action };
    }
  } catch (err) {
    res = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
