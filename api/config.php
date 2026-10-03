<?php
/**
 * Vadiva Tech Fest 2.0 API Configuration
 */

// Google Apps Script Web App URL for Google Sheet: 1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc
// Deploy google-apps-script-techfest.js as Web App (Execute as: Me, Who has access: Anyone)
if (!defined('TECHFEST_GAS_URL')) {
    define('TECHFEST_GAS_URL', getenv('TECHFEST_GAS_URL') ?: '');
}

// Meta Pixel ID
if (!defined('META_PIXEL_ID')) {
    define('META_PIXEL_ID', getenv('META_PIXEL_ID') ?: '');
}
