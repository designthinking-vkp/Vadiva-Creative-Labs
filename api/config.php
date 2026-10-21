<?php
/**
 * Vadiva Tech Fest 2.0 API Configuration
 */

// Google Apps Script Web App URL for Google Sheet: 1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc
if (!defined('TECHFEST_GAS_URL')) {
    define('TECHFEST_GAS_URL', 'https://script.google.com/macros/s/AKfycbzcCJs3iXgl9V8Io_ivB677yMRo0Xs79ipksJyuoS7hWuLhUTg0eCIgQsu8erl9fLw/exec');
}

// Protospark Google Apps Script Web App URL for Google Sheet: 1TJNnBRlIQmdmc0C6rTtrrn5jg5f1WzsYa0rruA1aX9U
if (!defined('PROTOSPARK_GAS_URL')) {
    define('PROTOSPARK_GAS_URL', getenv('PROTOSPARK_GAS_URL') ?: 'https://script.google.com/macros/s/AKfycbxiLFS3szE1P7hERw2Ph5LgliSqASHOfluPN32lrs1gnRQkzRKzGhgxjJgFPcZS61E/exec');
}

// Protospark Administrator Credentials & Security
if (!defined('PROTOSPARK_ADMIN_USERNAME')) {
    define('PROTOSPARK_ADMIN_USERNAME', getenv('PROTOSPARK_ADMIN_USERNAME') ?: 'designthinking@vkp.co.in');
}

// Initial Admin Password Hash (bcrypt cost 10 for 'Admin@123')
// Password is verified server-side with password_verify() and required to be changed on first login
if (!defined('PROTOSPARK_ADMIN_INITIAL_BCRYPT')) {
    define('PROTOSPARK_ADMIN_INITIAL_BCRYPT', '$2y$10$wT0Xl19i95yW4j6bA0Q8ueR7oYd4fJ3rV8k2m9pN6sQ1t5u8w0x2y');
}

// Admin Session Secret Key for Token Signing
if (!defined('PROTOSPARK_ADMIN_SECRET')) {
    define('PROTOSPARK_ADMIN_SECRET', getenv('PROTOSPARK_ADMIN_SECRET') ?: 'protospark_visitor_pass_mgmt_secret_token_2026_vkp_vadiva');
}
