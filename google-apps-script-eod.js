/**
 * Daily EOD Report Google Sheets Integration Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/10xB5_CIYibjPlj0CI6hfwXV24rbadTCFUcgWrElQMgo/edit
 * 2. Click Extensions > Apps Script in the menu.
 * 3. Delete any default code in Code.gs and paste this script.
 * 4. Click Save (disk icon).
 * 5. Click Deploy > New Deployment.
 * 6. Select "Web App" as the deployment type.
 * 7. Set Description: "EOD Reports API"
 * 8. Set Execute as: "Me"
 * 9. Set Who has access: "Anyone"
 * 10. Click Deploy and authorize all permissions.
 * 11. Copy the "Web app URL" and paste it as the API endpoint in the frontend eod-report.html page.
 */

function doPost(e) {
  var origin = "*";
  
  try {
    // Parse input parameters
    var data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }
    
    // Validate required fields
    if (!data.school || !data.subject || !data.inchargeName || !data.className || !data.sessionFocused || !data.topicsCovered || !data.status) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing required parameters."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Open Google Sheet by ID
    var spreadsheetId = "10xB5_CIYibjPlj0CI6hfwXV24rbadTCFUcgWrElQMgo";
    var ss = SpreadsheetApp.openById(spreadsheetId);
    
    // Map selected school to tab worksheet name
    var sheetName = data.school.trim();
    
    // Get or create the worksheet
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers if the sheet is empty
    var lastRow = sheet.getLastRow();
    var headers = [
      "Timestamp",
      "Date",
      "Time",
      "School",
      "Subject",
      "Incharge Name",
      "Class",
      "Session Focused",
      "Topics Covered",
      "Status",
      "Google Drive Link / Uploaded File URL"
    ];
    
    if (lastRow === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight("bold")
           .setBackground("#e3f2fd")
           .setFontColor("#0d47a1")
           .setBorder(true, true, true, true, true, true);
      lastRow = 1;
    }
    
    // Lock script execution to prevent writing overlaps during concurrent entries
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000); // Wait up to 30 seconds
    } catch (lockError) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Server is busy. Please try submitting again."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle File Upload to Google Drive (if present)
    var fileUrl = "";
    if (data.fileData && data.fileName) {
      try {
        var base64Data = data.fileData;
        // Strip the base64 MIME prefix if present (e.g. data:image/png;base64,)
        if (base64Data.indexOf(";") > -1) {
          base64Data = base64Data.split(",")[1];
        }
        var fileBytes = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(fileBytes, data.fileType || "application/octet-stream", data.fileName);
        
        // Save the file to Google Drive (in root or folder)
        var file = DriveApp.createFile(blob);
        // Make the file readable by anyone with the link
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      } catch (fileError) {
        lock.releaseLock();
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Failed to upload file to Google Drive: " + fileError.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (data.driveLink) {
      fileUrl = data.driveLink.trim();
    }
    
    // Generate dates
    var timestamp = new Date();
    var dateStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone() || "GMT+5:30", "yyyy-MM-dd");
    var timeStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone() || "GMT+5:30", "HH:mm:ss");
    
    // Row values mapping
    var rowValues = [
      timestamp,
      dateStr,
      timeStr,
      data.school,
      data.subject,
      data.inchargeName,
      data.className,
      data.sessionFocused,
      data.topicsCovered,
      data.status,
      fileUrl
    ];
    
    // Append values
    sheet.appendRow(rowValues);
    
    // Auto-fit column widths
    var numCols = headers.length;
    for (var col = 1; col <= numCols; col++) {
      sheet.autoResizeColumn(col);
    }
    
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "EOD Report submitted successfully."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    if (lock) lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput("<h3>Daily EOD API Endpoint is active. Please submit reporting data via POST.</h3>");
}
