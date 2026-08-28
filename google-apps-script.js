/**
 * Protospark 2026 Student Team Registration Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1zpCULOehOpgS9mhAG70raLhNGh1JOuxUzUhkcy_s1Ck/edit?gid=0#gid=0
 * 2. Click Extensions > Apps Script in the menu.
 * 3. Delete any default code in Code.gs and paste this script.
 * 4. Click Save (disk icon).
 * 5. Click Deploy > New Deployment.
 * 6. Select "Web App" as the deployment type.
 * 7. Set Description: "Protospark 2026 API"
 * 8. Set Execute as: "Me"
 * 9. Set Who has access: "Anyone"
 * 10. Click Deploy and authorize all permissions.
 * 11. Copy the "Web app URL" and paste it as the API endpoint in the frontend protospark-register.html page.
 */

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
  } catch (e) {
    Logger.log("parseFormString error: " + e.toString());
  }
  return res;
}

function doPost(e) {
  var origin = "*";
  
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
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
    
    var sheetUrl = "https://docs.google.com/spreadsheets/d/1zpCULOehOpgS9mhAG70raLhNGh1JOuxUzUhkcy_s1Ck/edit";
    var ss = SpreadsheetApp.openByUrl(sheetUrl);
    
    // Support saving to a specific custom sheet (e.g. for Dr. Herald Innovations)
    var sheetName = data.sheetName || "Submissions";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    var lastRow = sheet.getLastRow();

    // Handle Razorpay order creation via Google Apps Script (bypasses CORS for file:// and static hosting)
    if (data.action === "createRazorpayOrder") {
      var currency = data.currency || "INR";
      var amount = data.amount || (currency === "USD" ? 2000 : 192000); // $20 USD (2000 cents) or ₹1,920 INR (192000 paise)
      var receipt = data.receipt || ("rcpt_" + new Date().getTime());
      
      var keyId = "rzp_live_TJc8h2vN8fM4Nx";
      var keySecret = "Hwk3yDWs5Q6BBrSToRfaASd7";
      var authHeader = "Basic " + Utilities.base64Encode(keyId + ":" + keySecret);
      
      var fetchOpts = {
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": authHeader
        },
        payload: JSON.stringify({
          amount: parseInt(amount, 10),
          currency: currency,
          receipt: receipt
        }),
        muteHttpExceptions: true
      };
      
      try {
        var resp = UrlFetchApp.fetch("https://api.razorpay.com/v1/orders", fetchOpts);
        var respJson = JSON.parse(resp.getContentText());
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          order: respJson,
          key_id: keyId
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: err.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Handle payment screenshot or Razorpay payment verification update
    if (data.action === "updatePayment" || data.action === "confirmRazorpayPayment") {
      var regId = data.registrationId;
      var paymentScreenshotUrl = "";
      var amountText = data.amount || (data.currency === "USD" ? "$20.00 USD" : "₹1,920 INR");
      var paymentStatus = data.action === "confirmRazorpayPayment" || data.paymentId ? "Paid (" + amountText + ")" : "Under Verification";
      
      if (data.paymentId) {
        paymentScreenshotUrl = "Razorpay Payment ID: " + data.paymentId + " | Order ID: " + (data.orderId || "") + " | Amount: " + amountText + " | Date: " + new Date().toLocaleString();
      } else if (data.paymentScreenshotData && data.paymentScreenshotName) {
        try {
          var base64Data = data.paymentScreenshotData;
          if (base64Data.indexOf(";") > -1) {
            base64Data = base64Data.split(",")[1];
          }
          var fileBytes = Utilities.base64Decode(base64Data);
          var blob = Utilities.newBlob(fileBytes, data.paymentScreenshotType || "application/octet-stream", data.paymentScreenshotName);
          var file = DriveApp.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          paymentScreenshotUrl = file.getUrl();
        } catch (fileError) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "Failed to upload payment screenshot: " + fileError.toString()
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      // Look up row across all sheets to support multi-sheet registrations
      var found = null;
      if (regId) {
        found = findRowById(ss, regId);
      }
      if (!found && data.coordinatorEmail && data.schoolName && data.teamName) {
        found = findRowByDetails(ss, data.coordinatorEmail, data.schoolName, data.teamName);
      }
      
      if (found) {
        var targetSheet = found.sheet;
        var rowIndex = found.rowIndex;
        targetSheet.getRange(rowIndex, 28).setValue(paymentScreenshotUrl); // Column 28: Payment Info / Screenshot URL
        targetSheet.getRange(rowIndex, 29).setValue(paymentStatus); // Column 29: Payment Status
        
        // Trigger Meta Conversions API CRM event for payment status update
        try {
          checkAndTriggerMetaEventForNewRow(targetSheet, rowIndex);
        } catch (metaErr) {
          Logger.log("Meta API trigger failed for payment update: " + metaErr.toString());
        }
        
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Payment status updated to " + paymentStatus,
          paymentStatus: paymentStatus
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Registration details or ID not found."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Determine form type
    var isWorkshop = (sheetName === "Workshop Registrations" || data.type === "workshop");
    
    // Set headers if the sheet is empty
    var headers = isWorkshop ? [
      "Timestamp",
      "Registration ID",
      "School Name",
      "Name",
      "Class",
      "Address",
      "Contact Number",
      "Email ID"
    ] : [
      "Timestamp",
      "Registration ID",
      "School Name",
      "School Branch",
      "Coordinator Name",
      "Coordinator Designation",
      "Coordinator Email",
      "Coordinator Mobile",
      "Team Type",
      "Team Name",
      "Number Of Members",
      "Team Leader Name",
      "Team Leader Age Grade",
      "Division",
      "Member 2",
      "Member 3",
      "Member 4",
      "Member 5",
      "Area Of Interest",
      "Idea Theme",
      "Country Of Registration",
      "Food & Accommodation Required",
      "Special Requirements",
      "Travel Facilities Needed",
      "Travel Details",
      "Declaration 1",
      "Declaration 2",
      "Payment Screenshot",
      "Payment Status"
    ];
    
    if (lastRow === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e0f7fa").setFontColor("#1e2b6d");
      lastRow = 1;
    } else {
      var maxCols = Math.max(sheet.getLastColumn(), 30);
      var currentHeaders = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
      if (currentHeaders.length !== headers.length || (currentHeaders.length > 2 && String(currentHeaders[2]).trim() !== headers[2])) {
        sheet.getRange(1, 1, 1, maxCols).clearContent().clearFormat();
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e0f7fa").setFontColor("#1e2b6d");
      }
    }
    
    // Validate that at least essential details exist so empty requests don't write blank rows
    var hasTeamDetails = !!(data.schoolName || data.coordinatorName || data.teamLeaderName || data.coordinatorEmail);
    var hasWorkshopDetails = !!(data.name || data.email || data.contactNumber || data.studentName);
    
    if (!hasTeamDetails && !hasWorkshopDetails) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No valid registration details received. Please ensure form fields are filled out."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Lock script execution to prevent duplicate registration IDs during concurrent registrations
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000); // Wait up to 30 seconds
    } catch (lockError) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Server is busy. Please try submitting again."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!isWorkshop) {
      // Check for duplicate Email or Mobile globally for team registrations
      var dupCheck = checkDuplicateEmailOrMobile(ss, data.coordinatorEmail, data.coordinatorMobile);
      if (dupCheck.isDuplicate) {
        lock.releaseLock();
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: dupCheck.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Check for duplicate submission inside the target sheet
      var emailIndex = headers.indexOf("Coordinator Email");
      var schoolIndex = headers.indexOf("School Name");
      var teamIndex = headers.indexOf("Team Name");
      
      if (lastRow > 1) {
        var allData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
        for (var i = 0; i < allData.length; i++) {
          var row = allData[i];
          if (
            String(row[emailIndex]).trim().toLowerCase() === String(data.coordinatorEmail).trim().toLowerCase() &&
            String(row[schoolIndex]).trim().toLowerCase() === String(data.schoolName).trim().toLowerCase() &&
            String(row[teamIndex]).trim().toLowerCase() === String(data.teamName).trim().toLowerCase()
          ) {
            lock.releaseLock();
            return ContentService.createTextOutput(JSON.stringify({
              status: "error",
              message: "A team with this name under the same school coordinator has already been registered."
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }
    
    // Generate Registration ID (Sequence PS2026-0001, PSWS2026-0001, or PS2026-H0001 for Dr. Herald Innovations)
    var idNum = lastRow; // lastRow will be header (1) on first run, giving idNum = 1
    var regIdPrefix = "PS2026-";
    if (isWorkshop) {
      regIdPrefix = "PSWS2026-";
    } else if (sheetName.indexOf("DR. HERALD") !== -1) {
      regIdPrefix = "PS2026-H";
    }
    var regId = regIdPrefix + String(idNum).padStart(4, "0");
    var timestamp = new Date();
    
    // Map input fields to columns
    var rowValues = isWorkshop ? [
      timestamp,
      regId,
      data.schoolName || "",
      data.name || data.studentName || "",
      data.classGrade || data.studentClass || data.class || "",
      data.address || data.studentAddress || "",
      data.contactNumber || data.phone || "",
      data.email || data.emailId || ""
    ] : [
      timestamp,
      regId,
      data.schoolName || "",
      data.schoolBranch || "",
      data.coordinatorName || "",
      data.coordinatorDesignation || "",
      data.coordinatorEmail || "",
      data.coordinatorMobile || "",
      data.teamType || "",
      data.teamName || "",
      data.numMembers || 1,
      data.teamLeaderName || "",
      data.teamLeaderAgeGrade || "",
      data.division || "",
      data.member2 || "",
      data.member3 || "",
      data.member4 || "",
      data.member5 || "",
      data.areaOfInterest || "",
      data.ideaTheme || "",
      data.countryOfRegistration || "",
      data.foodAccommodationRequired || "",
      data.specialRequirements || "",
      data.travelFacilitiesNeeded || "",
      data.travelDetails || "",
      data.declaration1 || "",
      data.declaration2 || "",
      "", // Payment Screenshot
      "Pending" // Payment Status
    ];
    
    sheet.appendRow(rowValues);
    sheet.getRange(lastRow + 1, 2).setFontWeight("bold"); // Bold ID column
    
    // Trigger Meta Conversions API CRM event for the new lead
    try {
      checkAndTriggerMetaEventForNewRow(sheet, lastRow + 1);
    } catch (metaErr) {
      Logger.log("Meta API trigger failed for new row: " + metaErr.toString());
    }
    
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      registrationId: regId,
      message: "Registration completed successfully."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  var callback = e.parameter.callback;
  
  var sheetUrl = "https://docs.google.com/spreadsheets/d/1zpCULOehOpgS9mhAG70raLhNGh1JOuxUzUhkcy_s1Ck/edit";
  var ss = SpreadsheetApp.openByUrl(sheetUrl);
  
  var result = {};
  
  if (action === "getRegistrationId") {
    var isWorkshopQuery = (e.parameter.type === "workshop");
    var found = null;
    
    if (isWorkshopQuery) {
      var wEmail = e.parameter.email;
      var wName = e.parameter.name;
      found = findWorkshopRow(ss, wEmail, wName);
    } else {
      var email = e.parameter.coordinatorEmail;
      var team = e.parameter.teamName;
      var school = e.parameter.schoolName;
      found = findRowByDetails(ss, email, school, team);
    }
    
    if (found) {
      result = {
        status: "success",
        registrationId: String(found.row[1])
      };
    } else {
      result = {
        status: "error",
        message: "Registration not found."
      };
    }
  } else if (action === "checkDuplicate") {
    var emailParam = e.parameter.email;
    var mobileParam = e.parameter.mobile;
    var dupCheck = checkDuplicateEmailOrMobile(ss, emailParam, mobileParam);
    result = {
      status: "success",
      isDuplicate: dupCheck.isDuplicate,
      duplicateType: dupCheck.duplicateType || "",
      message: dupCheck.message || ""
    };
  } else if (action === "checkStatus") {
    var regId = e.parameter.registrationId;
    if (regId) {
      // Find row across all sheets so any registration ID works
      var found = findRowById(ss, regId);
      if (found) {
        var row = found.row;
        var registeredDate = "";
        if (row[0]) {
          try {
            registeredDate = new Date(row[0]).toLocaleString();
          } catch(dateErr) {
            registeredDate = String(row[0]);
          }
        }
        result = {
          status: "success",
          timestamp: registeredDate,
          registrationId: String(row[1]),
          schoolName: String(row[2]),
          schoolBranch: String(row[3]),
          coordinatorName: String(row[4]),
          coordinatorDesignation: String(row[5]),
          coordinatorEmail: String(row[6]),
          coordinatorMobile: String(row[7]),
          teamType: String(row[8]),
          teamName: String(row[9]),
          numMembers: String(row[10]),
          teamLeaderName: String(row[11]),
          teamLeaderAgeGrade: String(row[12]),
          division: String(row[13]),
          member2: String(row[14]),
          member3: String(row[15]),
          member4: String(row[16]),
          member5: String(row[17]),
          areaOfInterest: String(row[18]),
          ideaTheme: String(row[19]),
          countryOfRegistration: String(row[20]),
          foodAccommodationRequired: String(row[21]),
          specialRequirements: String(row[22]),
          travelFacilitiesNeeded: String(row[23]),
          travelDetails: String(row[24]),
          paymentStatus: String(row[28]) || "Pending"
        };
      }
    }
    if (!result.status) {
      result = {
        status: "error",
        message: "Registration ID not found. Please verify your ID."
      };
    }
  } else {
    result = {
      status: "success",
      message: "Hello from Vadiva Apps Script!"
    };
  }
  
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper to check if email or mobile is already registered in any sheet
function checkDuplicateEmailOrMobile(ss, email, mobile) {
  var sheets = ss.getSheets();
  var cleanEmail = email ? String(email).trim().toLowerCase() : "";
  var cleanMobile = mobile ? String(mobile).replace(/[+\s-]/g, "") : "";
  
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var lastCol = sheet.getLastColumn();
      var sheetHeaders = sheet.getRange(1, 1, 1, Math.min(lastCol, 30)).getValues()[0];
      var emailIdx = sheetHeaders.indexOf("Coordinator Email");
      var mobileIdx = sheetHeaders.indexOf("Coordinator Mobile");
      
      if (emailIdx !== -1 || mobileIdx !== -1) {
        var allData = sheet.getRange(2, 1, lastRow - 1, Math.min(lastCol, 30)).getValues();
        for (var r = 0; r < allData.length; r++) {
          var row = allData[r];
          if (cleanEmail && emailIdx !== -1 && row[emailIdx]) {
            if (String(row[emailIdx]).trim().toLowerCase() === cleanEmail) {
              return { isDuplicate: true, duplicateType: "Email ID", message: "This Email ID is already registered." };
            }
          }
          if (cleanMobile && mobileIdx !== -1 && row[mobileIdx]) {
            var rowMobileClean = String(row[mobileIdx]).replace(/[+\s-]/g, "");
            if (rowMobileClean && rowMobileClean === cleanMobile) {
              return { isDuplicate: true, duplicateType: "Mobile number", message: "This Mobile number is already registered." };
            }
          }
        }
      }
    }
  }
  return { isDuplicate: false };
}

// Helper to look up a row by Registration ID across all sheets
function findRowById(ss, regId) {
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var allData = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 30)).getValues();
      for (var r = 0; r < allData.length; r++) {
        var row = allData[r];
        if (row[1] && String(row[1]).trim().toLowerCase() === String(regId).trim().toLowerCase()) {
          return { sheet: sheet, rowIndex: r + 2, row: row };
        }
      }
    }
  }
  return null;
}

// Helper to look up a row by coordinator email, school name, and team name across all sheets
function findRowByDetails(ss, email, school, team) {
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var allData = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 30)).getValues();
      for (var r = 0; r < allData.length; r++) {
        var row = allData[r];
        if (
          row[6] && String(row[6]).trim().toLowerCase() === String(email).trim().toLowerCase() &&
          row[2] && String(row[2]).trim().toLowerCase() === String(school).trim().toLowerCase() &&
          row[9] && String(row[9]).trim().toLowerCase() === String(team).trim().toLowerCase()
        ) {
          return { sheet: sheet, rowIndex: r + 2, row: row };
        }
      }
    }
  }
  return null;
}

function findWorkshopRow(ss, email, name) {
  var sheet = ss.getSheetByName("Workshop Registrations");
  if (!sheet) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var allData = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 8)).getValues();
    // Search backwards to get the most recent registration
    for (var r = allData.length - 1; r >= 0; r--) {
      var row = allData[r];
      if (
        row[7] && String(row[7]).trim().toLowerCase() === String(email).trim().toLowerCase() &&
        row[3] && String(row[3]).trim().toLowerCase() === String(name).trim().toLowerCase()
      ) {
        return { sheet: sheet, rowIndex: r + 2, row: row };
      }
    }
  }
  return null;
}

/**
 * Run this function ONCE manually in Apps Script Editor to fix and clean up headers 
 * strictly for the "Workshop Registrations" sheet.
 */
function fixWorkshopHeadersOnly() {
  var sheetUrl = "https://docs.google.com/spreadsheets/d/1zpCULOehOpgS9mhAG70raLhNGh1JOuxUzUhkcy_s1Ck/edit";
  var ss = SpreadsheetApp.openByUrl(sheetUrl);
  
  var workshopHeaders = [
    "Timestamp",
    "Registration ID",
    "Name",
    "Class",
    "Address",
    "Contact Number",
    "Email ID"
  ];
  
  // Reset & clean ONLY "Workshop Registrations" sheet headers
  var wsSheet = ss.getSheetByName("Workshop Registrations");
  if (wsSheet) {
    var maxCol = Math.max(wsSheet.getLastColumn(), 30);
    wsSheet.getRange(1, 1, 1, maxCol).clearContent().clearFormat();
    wsSheet.getRange(1, 1, 1, workshopHeaders.length).setValues([workshopHeaders])
           .setFontWeight("bold").setBackground("#e0f7fa").setFontColor("#1e2b6d");
    Logger.log("Workshop Registrations headers reset successfully!");
  }
}

// Run manually once to trigger and authorize Drive access permissions
function runAuthTrigger() {
  try {
    var file = DriveApp.createFile("authorization_test.txt", "Auth Check");
    DriveApp.removeFile(file);
    Logger.log("Authorization successful!");
  } catch (e) {
    Logger.log("Error authorizing: " + e.toString());
  }
}

// ==========================================================================
// META CONVERSIONS API CRM INTEGRATION MODULES (APPENDED)
// ==========================================================================

// ==========================================================
// --- MODULE 1: CONFIGURATION (meta-config.js) ---
// ==========================================================

const CONFIG = {
  // Map Lead Status or Payment Status values to Meta CRM Event Names.
  // Standard Meta Events: Lead, Prospect, Contact, QualifiedLead, Schedule, CampusVisit, ApplicationSubmitted, AdmissionConfirmed, InitiateCheckout, CompleteRegistration, etc.
  LEAD_STATUS_EVENT_MAP: {
    "Qualified": "QualifiedLead",
    "Scheduled": "Schedule",
    "Visited": "CampusVisit",
    "Applied": "ApplicationSubmitted",
    "Confirmed": "AdmissionConfirmed",
    
    // Existing values from payment status in google-apps-script.js
    "Under Verification": "ApplicationSubmitted",
    "Pending": "InitiateCheckout"
  },

  // Name of the sheet to store Meta Conversions API event logs
  LOG_SHEET_NAME: "Meta Events",

  // Retry settings for failed events
  MAX_RETRIES: 3,
  
  // Set to true to allow resending an event that has already been successfully sent
  ALLOW_RESEND: false,

  // Mapping of user field groups to potential column header names in Google Sheet.
  // The system dynamically matches headers (case-insensitive) to find column indexes.
  HEADERS: {
    LEAD_ID: ["Lead ID", "Registration ID", "ID"],
    NAME: ["Name", "Lead Name", "Coordinator Name", "Student Name", "Parent Name"],
    PHONE: ["Phone", "Mobile", "Contact Number", "Coordinator Mobile", "Parent Mobile", "Student Mobile"],
    EMAIL: ["Email", "Email ID", "Email Address", "Coordinator Email", "Parent Email"],
    CITY: ["City"],
    STATE: ["State"],
    COUNTRY: ["Country", "Country Of Registration"],
    ZIP: ["ZIP", "Zip Code", "Postal Code"],
    CAMPAIGN: ["Campaign", "Campaign Name"],
    SOURCE: ["Source", "Lead Source"],
    STATUS: ["Lead Status", "Status", "Payment Status"],
    TIMESTAMP: ["Timestamp", "Date"]
  }
};

// ==========================================================
// --- MODULE 2: HASHING & NORMALIZATION (meta-hashing.js) ---
// ==========================================================

/**
 * Generates SHA-256 hash of a string after applying basic trim and lowercase.
 * Returns empty string if value is empty.
 * 
 * @param {string} value Raw input value to hash
 * @return {string} SHA-256 hex string
 */
function sha256(value) {
  if (value === null || value === undefined) return "";
  var cleaned = String(value).trim().toLowerCase();
  if (!cleaned) return "";
  
  try {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cleaned, Utilities.Charset.UTF_8);
    var hex = "";
    for (var i = 0; i < digest.length; i++) {
      var byteVal = digest[i];
      if (byteVal < 0) {
        byteVal += 256;
      }
      var byteString = byteVal.toString(16);
      if (byteString.length == 1) {
        byteString = "0" + byteString;
      }
      hex += byteString;
    }
    return hex;
  } catch (err) {
    Logger.log("SHA-256 hashing error: " + err.toString());
    return "";
  }
}

/**
 * Normalizes phone numbers: removes all non-digit characters and leading zeros.
 * 
 * @param {string} phone Raw phone number
 * @return {string} Normalized phone number
 */
function normalizePhone(phone) {
  if (!phone) return "";
  // Strip all non-digit characters
  var cleaned = String(phone).replace(/\D/g, "");
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, "");
  return cleaned;
}

/**
 * Normalizes country to ISO 2-letter format if known, otherwise returns trimmed lowercase.
 * 
 * @param {string} country Raw country name
 * @return {string} 2-letter country code or cleaned string
 */
function normalizeCountry(country) {
  if (!country) return "";
  var c = String(country).trim().toLowerCase();
  if (c.length === 2) return c;
  
  // Mapping of common countries to ISO 2-letter codes
  var countryMap = {
    "india": "in",
    "united states": "us",
    "usa": "us",
    "united kingdom": "gb",
    "uk": "gb",
    "canada": "ca",
    "australia": "au",
    "singapore": "sg",
    "united arab emirates": "ae",
    "uae": "ae",
    "malaysia": "my",
    "new zealand": "nz",
    "germany": "de",
    "france": "fr"
  };
  return countryMap[c] || c;
}

/**
 * Splits a full name into First Name and Last Name.
 * 
 * @param {string} fullName Raw full name
 * @return {object} { first: string, last: string }
 */
function parseName(fullName) {
  if (!fullName) return { first: "", last: "" };
  var parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }
  var first = parts[0];
  var last = parts.slice(1).join(" ");
  return { first: first, last: last };
}

// ==========================================================
// --- MODULE 3: API CONNECTOR (meta-api.js) ---
// ==========================================================

/**
 * Sends a CRM event to Meta Conversions API.
 * 
 * @param {object} leadData Customer information object
 * @param {string} eventName The standard Meta event name (e.g., QualifiedLead)
 * @return {object} { success: boolean, code: number, text: string }
 */
function sendEventToMeta(leadData, eventName) {
  var properties = PropertiesService.getScriptProperties();
  var datasetId = properties.getProperty("META_DATASET_ID");
  var accessToken = properties.getProperty("META_ACCESS_TOKEN");
  
  if (!datasetId || !accessToken) {
    var errorMsg = "Credentials missing. Set META_DATASET_ID and META_ACCESS_TOKEN in Script Properties.";
    Logger.log(errorMsg);
    return {
      success: false,
      code: 401,
      text: errorMsg
    };
  }
  
  var url = "https://graph.facebook.com/v25.0/" + datasetId + "/events?access_token=" + accessToken;
  
  // 1. Prepare User Data (PII hashed using SHA-256)
  var userData = {};
  
  if (leadData.email) {
    userData.em = sha256(leadData.email);
  }
  
  if (leadData.phone) {
    userData.ph = sha256(normalizePhone(leadData.phone));
  }
  
  if (leadData.name) {
    var parsedName = parseName(leadData.name);
    if (parsedName.first) {
      userData.fn = sha256(parsedName.first);
    }
    if (parsedName.last) {
      userData.ln = sha256(parsedName.last);
    }
  }
  
  if (leadData.city) {
    userData.ct = sha256(leadData.city);
  }
  
  if (leadData.state) {
    userData.st = sha256(leadData.state);
  }
  
  if (leadData.zip) {
    userData.zp = sha256(leadData.zip);
  }
  
  if (leadData.country) {
    userData.country = sha256(normalizeCountry(leadData.country));
  }
  
  if (leadData.leadId) {
    userData.external_id = sha256(leadData.leadId);
  }

  // 2. Build complete Event Payload
  // Use Unix timestamp in seconds for event_time
  var eventTime = Math.floor(Date.now() / 1000);
  if (leadData.timestamp) {
    try {
      var d = new Date(leadData.timestamp);
      if (!isNaN(d.getTime())) {
        eventTime = Math.floor(d.getTime() / 1000);
      }
    } catch (e) {
      // Fallback to current time
    }
  }

  var eventPayload = {
    event_name: eventName,
    event_time: eventTime,
    user_data: userData,
    custom_data: {
      lead_id: leadData.leadId || "",
      campaign: leadData.campaign || "",
      source: leadData.source || ""
    },
    action_source: "system_generated"
  };
  
  var payload = {
    data: [eventPayload]
  };
  
  // 3. Send HTTP POST request
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    return {
      success: responseCode >= 200 && responseCode < 300,
      code: responseCode,
      text: responseText
    };
  } catch (httpError) {
    Logger.log("UrlFetchApp failed: " + httpError.toString());
    return {
      success: false,
      code: 500,
      text: httpError.toString()
    };
  }
}

// ==========================================================
// --- MODULE 4: EVENT LOGGING & DUPLICATE CHECKS (meta-logger.js) ---
// ==========================================================

/**
 * Checks if a specific event has already been successfully sent to Meta for a Lead ID.
 * 
 * @param {string} leadId The CRM lead/registration identifier
 * @param {string} eventName The standard Meta event name
 * @return {boolean} True if event was already successfully sent, false otherwise
 */
function isEventAlreadySent(leadId, eventName) {
  if (CONFIG.ALLOW_RESEND) return false;
  if (!leadId) return false;
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    if (!logSheet) return false;
    
    var lastRow = logSheet.getLastRow();
    if (lastRow < 2) return false;
    
    // Read the log columns: Lead ID, Event Name, and Success/Failure status
    var data = logSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var loggedLeadId = String(row[0]).trim();
      var loggedEventName = String(row[1]).trim();
      var loggedSuccess = String(row[6]).trim(); // "Success" or "Failure"
      
      if (loggedLeadId === String(leadId).trim() && 
          loggedEventName === String(eventName).trim() && 
          loggedSuccess === "Success") {
        return true;
      }
    }
  } catch (err) {
    Logger.log("Error checking duplicate event: " + err.toString());
  }
  return false;
}

/**
 * Appends a record to the "Meta Events" logging sheet. Creates sheet if it doesn't exist.
 * 
 * @param {string} leadId Lead ID
 * @param {string} eventName Event Name
 * @param {string} status Short status message
 * @param {number} responseCode HTTP status code
 * @param {string} metaResponse Full HTTP response text
 * @param {boolean} isSuccess Whether the API call was successful
 * @param {number} retryCount Retry count
 */
function logMetaEvent(leadId, eventName, status, responseCode, metaResponse, isSuccess, retryCount) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    
    // Create log sheet and headers if not present
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
      var headers = [
        "Lead ID",
        "Event Name",
        "Status",
        "Response Code",
        "Event Time",
        "Meta Response",
        "Success/Failure",
        "Retry Count"
      ];
      logSheet.appendRow(headers);
      logSheet.getRange(1, 1, 1, headers.length)
              .setFontWeight("bold")
              .setBackground("#e0f7fa")
              .setFontColor("#006064")
              .setBorder(true, true, true, true, true, true);
    }
    
    // Append the log row
    logSheet.appendRow([
      leadId || "",
      eventName || "",
      status || "",
      responseCode || "",
      new Date(),
      metaResponse || "",
      isSuccess ? "Success" : "Failure",
      retryCount || 0
    ]);
    
    // Keep sheet compact by auto-resizing columns
    var lastCol = logSheet.getLastColumn();
    for (var col = 1; col <= lastCol; col++) {
      logSheet.autoResizeColumn(col);
    }
    
  } catch (err) {
    Logger.log("Error logging Meta event: " + err.toString());
  }
}

/**
 * Extracts customer data from a sheet row dynamically using the headers configuration.
 * Maps values to standard lead keys.
 * 
 * @param {Sheet} sheet Google Sheet worksheet object
 * @param {number} rowIndex 1-indexed row number
 * @return {object} Customer fields mapped by key
 */
function getLeadDataFromRow(sheet, rowIndex) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rowValues = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
  
  // Helper to match headers case-insensitively and return value
  function getValueForHeader(headerKeys) {
    for (var i = 0; i < headers.length; i++) {
      var headerVal = String(headers[i]).trim().toLowerCase();
      for (var j = 0; j < headerKeys.length; j++) {
        if (headerVal === headerKeys[j].toLowerCase()) {
          return rowValues[i];
        }
      }
    }
    return "";
  }
  
  var leadData = {
    leadId: getValueForHeader(CONFIG.HEADERS.LEAD_ID),
    name: getValueForHeader(CONFIG.HEADERS.NAME),
    phone: getValueForHeader(CONFIG.HEADERS.PHONE),
    email: getValueForHeader(CONFIG.HEADERS.EMAIL),
    city: getValueForHeader(CONFIG.HEADERS.CITY),
    state: getValueForHeader(CONFIG.HEADERS.STATE),
    country: getValueForHeader(CONFIG.HEADERS.COUNTRY),
    zip: getValueForHeader(CONFIG.HEADERS.ZIP),
    campaign: getValueForHeader(CONFIG.HEADERS.CAMPAIGN),
    source: getValueForHeader(CONFIG.HEADERS.SOURCE),
    status: getValueForHeader(CONFIG.HEADERS.STATUS),
    timestamp: getValueForHeader(CONFIG.HEADERS.TIMESTAMP)
  };
  
  return leadData;
}

// ==========================================================
// --- MODULE 5: TRIGGERS & TESTING (meta-triggers.js) ---
// ==========================================================

/**
 * Hook to check and trigger Meta CRM events for a newly added or modified row.
 * Can be invoked from doPost or other spreadsheet handlers.
 * 
 * @param {Sheet} sheet The sheet containing the lead
 * @param {number} rowIndex The row index of the lead
 */
function checkAndTriggerMetaEventForNewRow(sheet, rowIndex) {
  try {
    var leadData = getLeadDataFromRow(sheet, rowIndex);
    if (!leadData.status) return;
    
    var eventName = CONFIG.LEAD_STATUS_EVENT_MAP[leadData.status];
    if (!eventName) return; // Not a qualifying status
    
    // Fallback for ID if missing
    if (!leadData.leadId) {
      leadData.leadId = "ROW-" + sheet.getName().replace(/\s+/g, "_") + "-" + rowIndex;
    }
    
    if (isEventAlreadySent(leadData.leadId, eventName)) return;
    
    var result = sendEventToMeta(leadData, eventName);
    
    logMetaEvent(
      leadData.leadId,
      eventName,
      result.success ? "Success" : "Failure",
      result.code,
      result.text,
      result.success,
      0
    );
  } catch (err) {
    Logger.log("Error in checkAndTriggerMetaEventForNewRow: " + err.toString());
  }
}

/**
 * Installable Edit Trigger function.
 * Capture edits to the Status/Lead Status columns and trigger CRM events.
 * 
 * Note: Must be registered as an installable edit trigger in Apps Script console.
 * Do NOT use standard simple onEdit(e) because simple triggers lack URL fetch permissions.
 * 
 * @param {object} e Google Apps Script edit event object
 */
function onCrmEdit(e) {
  try {
    if (!e) return;
    
    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();
    
    // Ignore edits on the Meta Events log sheet
    if (sheetName === CONFIG.LOG_SHEET_NAME) return;
    
    var editedRow = range.getRow();
    var editedCol = range.getColumn();
    
    // Check if the edited column matches our status columns
    var header = String(sheet.getRange(1, editedCol).getValue()).trim().toLowerCase();
    var isStatusColumn = false;
    var statusHeaders = CONFIG.HEADERS.STATUS;
    for (var i = 0; i < statusHeaders.length; i++) {
      if (header === statusHeaders[i].toLowerCase()) {
        isStatusColumn = true;
        break;
      }
    }
    
    if (!isStatusColumn) return;
    
    var newStatus = String(range.getValue()).trim();
    if (!newStatus) return;
    
    var eventName = CONFIG.LEAD_STATUS_EVENT_MAP[newStatus];
    if (!eventName) return; // No mapped event for this status
    
    var leadData = getLeadDataFromRow(sheet, editedRow);
    
    if (!leadData.leadId) {
      leadData.leadId = "ROW-" + sheetName.replace(/\s+/g, "_") + "-" + editedRow;
    }
    
    if (isEventAlreadySent(leadData.leadId, eventName)) return;
    
    var result = sendEventToMeta(leadData, eventName);
    
    logMetaEvent(
      leadData.leadId,
      eventName,
      result.success ? "Success" : "Failure",
      result.code,
      result.text,
      result.success,
      0
    );
  } catch (err) {
    Logger.log("Error in onCrmEdit: " + err.toString());
  }
}

/**
 * Time-driven trigger function to retry failed Conversions API events.
 * Scans "Meta Events" sheet for failed rows, resolves lead data,
 * and retries transmission up to MAX_RETRIES.
 */
function retryFailedEvents() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    if (!logSheet) return;
    
    var lastRow = logSheet.getLastRow();
    if (lastRow < 2) return;
    
    var range = logSheet.getRange(2, 1, lastRow - 1, logSheet.getLastColumn());
    var data = range.getValues();
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var logRowIndex = i + 2;
      
      var leadId = String(row[0]).trim();
      var eventName = String(row[1]).trim();
      var successFailure = String(row[6]).trim(); // Column 7: Success/Failure status
      var retryCount = parseInt(row[7]) || 0; // Column 8: Retry Count
      
      if (successFailure === "Failure" && retryCount < CONFIG.MAX_RETRIES) {
        // Resolve lead data from sheets
        var found = findRowById(ss, leadId);
        
        // Fallback resolution for ROW-SheetName-Index format
        if (!found && leadId.indexOf("ROW-") === 0) {
          var parts = leadId.split("-");
          if (parts.length >= 3) {
            var targetSheetName = parts[1].replace(/_/g, " ");
            var targetRowIndex = parseInt(parts[2]);
            var targetSheet = ss.getSheetByName(targetSheetName);
            if (targetSheet && targetRowIndex > 1 && targetRowIndex <= targetSheet.getLastRow()) {
              found = { sheet: targetSheet, rowIndex: targetRowIndex };
            }
          }
        }
        
        if (found) {
          var leadData = getLeadDataFromRow(found.sheet, found.rowIndex);
          if (!leadData.leadId) {
            leadData.leadId = leadId; // Preserve original fallback lead ID
          }
          
          var newRetryCount = retryCount + 1;
          
          // Re-send event
          var result = sendEventToMeta(leadData, eventName);
          
          // Update the logs sheet in-place
          logSheet.getRange(logRowIndex, 3).setValue(result.success ? "Success" : "Failure");
          logSheet.getRange(logRowIndex, 4).setValue(result.code);
          logSheet.getRange(logRowIndex, 5).setValue(new Date());
          logSheet.getRange(logRowIndex, 6).setValue(result.text);
          logSheet.getRange(logRowIndex, 7).setValue(result.success ? "Success" : "Failure");
          logSheet.getRange(logRowIndex, 8).setValue(newRetryCount);
          
          Utilities.sleep(100); // Small pause to respect API rate limits
        } else {
          // Lead record no longer exists. Mark retry count to max to prevent endless checking
          logSheet.getRange(logRowIndex, 7).setValue("Failure (Lead Not Found)");
          logSheet.getRange(logRowIndex, 8).setValue(CONFIG.MAX_RETRIES);
        }
      }
    }
  } catch (err) {
    Logger.log("Error in retryFailedEvents: " + err.toString());
  }
}

/**
 * Automated test suite. Run this function manually from Google Apps Script editor
 * to verify the hashing engine, duplicate checks, and API connectivity.
 */
function runCrmTests() {
  Logger.log("=== STARTING CRM INTEGRATION TESTS ===");
  
  // Test 1: Hashing & Normalization
  Logger.log("[Test 1] Hashing & Normalization");
  var emailRaw = "  Test.Email@Gmail.com  ";
  var emailHashed = sha256(emailRaw);
  var expectedEmailHash = "f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a"; // sha256 of "test.email@gmail.com"
  
  if (emailHashed === expectedEmailHash) {
    Logger.log(" PASS: Email hashing matches.");
  } else {
    Logger.log(" FAIL: Email hashing mismatch. Got: " + emailHashed);
  }
  
  var phoneRaw = " +1 (555) 019-9284  ";
  var phoneNormalized = normalizePhone(phoneRaw);
  if (phoneNormalized === "15550199284") {
    Logger.log(" PASS: Phone normalization matches.");
  } else {
    Logger.log(" FAIL: Phone normalization. Got: " + phoneNormalized);
  }
  
  var nameRaw = "Dr. Herald Innovations";
  var parsedName = parseName(nameRaw);
  if (parsedName.first === "Dr." && parsedName.last === "Herald Innovations") {
    Logger.log(" PASS: Name splitting matches.");
  } else {
    Logger.log(" FAIL: Name splitting mismatch. Got: " + JSON.stringify(parsedName));
  }
  
  // Test 2: Duplicate Check
  Logger.log("[Test 2] Duplicate Prevention");
  var testLeadId = "TEST-ID-" + Math.floor(Math.random() * 100000);
  var testEvent = "QualifiedLead";
  
  var isSentBefore = isEventAlreadySent(testLeadId, testEvent);
  Logger.log(" Initial check (should be false): " + isSentBefore);
  
  logMetaEvent(testLeadId, testEvent, "Success", 200, "{\"fbtrace_id\":\"test\"}", true, 0);
  var isSentAfter = isEventAlreadySent(testLeadId, testEvent);
  Logger.log(" Post-log check (should be true): " + isSentAfter);
  
  if (!isSentBefore && isSentAfter) {
    Logger.log(" PASS: Duplicate prevention working correctly.");
  } else {
    Logger.log(" FAIL: Duplicate prevention check failure.");
  }
  
  // Test 3: API Credentials Validation
  Logger.log("[Test 3] Credentials Check");
  var datasetId = PropertiesService.getScriptProperties().getProperty("META_DATASET_ID");
  var accessToken = PropertiesService.getScriptProperties().getProperty("META_ACCESS_TOKEN");
  Logger.log(" META_DATASET_ID configured: " + (datasetId ? "Yes (" + datasetId + ")" : "No"));
  Logger.log(" META_ACCESS_TOKEN configured: " + (accessToken ? "Yes" : "No"));
  
  Logger.log("=== CRM INTEGRATION TESTS COMPLETED ===");
}

/**
 * Sets the Meta Conversions API credentials in Script Properties.
 * Run this function once in the Apps Script Editor to configure or update your credentials.
 */
function setupMetaCredentials() {
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty("META_DATASET_ID", "1825401188855459");
  properties.setProperty("META_ACCESS_TOKEN", "EAAXQcJZCdxggBSE3fi2EmIicGz7SrbLrEXZCNZBvBHYAM96yv4Kh0PzGEJgdmNWPcvjQgR3MNlqlzngpSKe0dNARNidktV0HPmYrhV42ZB9zI5zwRu5sZBsuovUHRhLZCAjMj2rNM5YGa0E3cw4PSRB4M8gh8AvKnO6QjKyRZB38wZBgXqUZC5MRGpDvb2mLOGgZDZD");
  Logger.log("Meta Conversions API credentials configured successfully.");
  Logger.log("META_DATASET_ID: " + properties.getProperty("META_DATASET_ID"));
  Logger.log("META_ACCESS_TOKEN: Configured (Length: " + properties.getProperty("META_ACCESS_TOKEN").length + ")");
}

