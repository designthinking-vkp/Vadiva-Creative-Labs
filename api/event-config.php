<?php
/**
 * Vadiva Creative Labs - 2026 Flagship Events Configuration
 * Handles Razorpay credentials, Google Sheets integration and event pricing.
 */

// Target Google Spreadsheet ID
if (!defined('EVENT_SPREADSHEET_ID')) {
    define('EVENT_SPREADSHEET_ID', getenv('EVENT_SPREADSHEET_ID') ?: '1U3I2U_xMa0ChSSxCbYTrzlAV2f2wjBWZ3P6sF4RufF0');
}

// Google Apps Script Web App URL for Event Registrations
if (!defined('EVENT_GAS_URL')) {
    define('EVENT_GAS_URL', getenv('EVENT_GAS_URL') ?: 'https://script.google.com/macros/s/AKfycbxK6vANPdnlY8k0c0y7XZFLFzVjBuwX3d3niWDKg1sSfvPSN78k1qMImEBhSLK-uSp35Q/exec');
}

// Google Cloud Service Account Key Path (optional, for direct Google Sheets API v4 access)
if (!defined('GOOGLE_SERVICE_ACCOUNT_KEY')) {
    define('GOOGLE_SERVICE_ACCOUNT_KEY', getenv('GOOGLE_SERVICE_ACCOUNT_KEY') ?: (__DIR__ . '/google-service-account.json'));
}

// Razorpay Live API Credentials
if (!defined('EVENT_RAZORPAY_KEY_ID')) {
    define('EVENT_RAZORPAY_KEY_ID', getenv('RAZORPAY_KEY_ID') ?: 'rzp_live_TJc8h2vN8fM4Nx');
}

if (!defined('EVENT_RAZORPAY_KEY_SECRET')) {
    define('EVENT_RAZORPAY_KEY_SECRET', getenv('RAZORPAY_KEY_SECRET') ?: 'Hwk3yDWs5Q6BBrSToRfaASd7');
}

// Event Metadata & Official Fees (in INR and paise)
$EVENT_CATALOG = array(
    'kids-maker-fair-2026' => array(
        'id' => 'kids-maker-fair-2026',
        'tabName' => 'Maker Fair',
        'title' => 'Kids Maker Fair & Repair Mela',
        'tagline' => 'Make it. Fix it. Reuse it!',
        'date' => '29 November 2026',
        'time' => '10:30 AM – 3:30 PM',
        'venue' => 'Santhome, Vadiva Creative Labs',
        'ageGroup' => '6–16 years',
        'feeINR' => 99,
        'amountPaise' => 9900,
        'prefix' => 'KMF26',
        'badge' => 'One-Day Maker Carnival'
    ),
    'protospark-forge-2026' => array(
        'id' => 'protospark-forge-2026',
        'tabName' => 'ProtoSpark Forge',
        'title' => 'ProtoSpark Forge',
        'tagline' => 'PROTOTYPE → PRODUCT',
        'date' => '26–30 December 2026',
        'time' => '5 Days, 4 Nights (Sleep Over)',
        'venue' => 'TVIS, Ponneri',
        'ageGroup' => 'Grades 8–12',
        'feeINR' => 6000,
        'amountPaise' => 600000,
        'prefix' => 'PSF26',
        'badge' => '5-Day Residential Bootcamp'
    ),
    'shipwreck-island-2026' => array(
        'id' => 'shipwreck-island-2026',
        'tabName' => 'Shipwreck Island',
        'title' => 'Shipwreck Island',
        'tagline' => '3 DAYS TO BUILD YOUR WAY HOME!',
        'date' => '26–30 December 2026',
        'time' => 'Stay-in Camp',
        'venue' => 'TVIS, Ponneri',
        'ageGroup' => 'Grades 5–11',
        'feeINR' => 6000,
        'amountPaise' => 600000,
        'prefix' => 'SWI26',
        'badge' => 'Residential Adventure Maker Camp'
    )
);

/**
 * Normalizes event slug or title to catalog item
 */
function getEventInfo($eventSlugOrName) {
    global $EVENT_CATALOG;
    if (empty($eventSlugOrName)) return null;
    $key = strtolower(trim($eventSlugOrName));
    
    if (isset($EVENT_CATALOG[$key])) {
        return $EVENT_CATALOG[$key];
    }
    
    if (strpos($key, 'maker') !== false || strpos($key, 'repair') !== false || strpos($key, 'kmf') !== false) {
        return $EVENT_CATALOG['kids-maker-fair-2026'];
    }
    if (strpos($key, 'forge') !== false || strpos($key, 'protospark') !== false || strpos($key, 'psf') !== false) {
        return $EVENT_CATALOG['protospark-forge-2026'];
    }
    if (strpos($key, 'shipwreck') !== false || strpos($key, 'island') !== false || strpos($key, 'swi') !== false) {
        return $EVENT_CATALOG['shipwreck-island-2026'];
    }
    
    return null;
}
