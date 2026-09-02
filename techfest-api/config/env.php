<?php
/**
 * TechFest Environment Configuration Loader
 * Vadiva Creative Labs - TechFest 3.0
 */

// Load from environment or fallback constants
if (!function_exists('tf_env')) {
    function tf_env($key, $default = null) {
        $val = getenv($key);
        if ($val !== false && $val !== '') {
            return $val;
        }
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return $_SERVER[$key];
        }
        return $default;
    }
}

// App Environment
defined('TF_APP_ENV') or define('TF_APP_ENV', tf_env('APP_ENV', 'production'));

// Centralized Developer Test Mode Config
$rawTestMode = tf_env('TEST_MODE', false);
defined('TEST_MODE') or define('TEST_MODE', ($rawTestMode === 'true' || $rawTestMode === true || $rawTestMode === '1'));
defined('TEST_MODE_SECRET') or define('TEST_MODE_SECRET', tf_env('TEST_MODE_SECRET', 'VADIVA_TEST_BYPASS_2026'));
defined('TEST_OTP') or define('TEST_OTP', tf_env('TEST_OTP', '123456'));

if (!function_exists('isTestModeActive')) {
    function isTestModeActive($clientSecret = '') {
        return TEST_MODE && !empty($clientSecret) && hash_equals(TEST_MODE_SECRET, (string)$clientSecret);
    }
}

// Razorpay Credentials
defined('RAZORPAY_KEY_ID') or define('RAZORPAY_KEY_ID', tf_env('RAZORPAY_KEY_ID', 'rzp_live_TJc8h2vN8fM4Nx'));
defined('RAZORPAY_KEY_SECRET') or define('RAZORPAY_KEY_SECRET', tf_env('RAZORPAY_KEY_SECRET', 'Hwk3yDWs5Q6BBrSToRfaASd7'));
defined('RAZORPAY_WEBHOOK_SECRET') or define('RAZORPAY_WEBHOOK_SECRET', tf_env('RAZORPAY_WEBHOOK_SECRET', 'vadiva_tf_webhook_secret_2026'));

// Hostinger MySQL Database Credentials
defined('DB_HOST') or define('DB_HOST', tf_env('DB_HOST', 'localhost'));
defined('DB_PORT') or define('DB_PORT', tf_env('DB_PORT', '3306'));
defined('DB_DATABASE') or define('DB_DATABASE', tf_env('DB_DATABASE', tf_env('DB_NAME', 'u847742361_techfest')));
defined('DB_USERNAME') or define('DB_USERNAME', tf_env('DB_USERNAME', tf_env('DB_USER', 'u847742361_admin')));
defined('DB_PASSWORD') or define('DB_PASSWORD', tf_env('DB_PASSWORD', 'Admin@techfest2026'));
?>
