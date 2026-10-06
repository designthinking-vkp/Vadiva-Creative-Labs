<?php
/**
 * Vadiva's Tech & Design Fest 2.0 - Lead Submission API Endpoint
 * Secure server-side processing for Meta Ads landing page
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'success' => false,
        'error' => 'Method not allowed. Use POST.'
    ));
    exit;
}

// 1. Rate Limiting / Flood Protection (IP-based lightweight throttle)
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip) . '.json';

if (file_exists($rateLimitFile)) {
    $rateData = json_decode(@file_get_contents($rateLimitFile), true);
    if ($rateData && isset($rateData['count'], $rateData['first_request'])) {
        if (time() - $rateData['first_request'] < 60) {
            if ($rateData['count'] > 15) { // max 15 submissions per minute per IP
                http_response_code(429);
                echo json_encode(array(
                    'success' => false,
                    'error' => 'Too many submissions. Please wait a moment before trying again.'
                ));
                exit;
            }
            $rateData['count']++;
            @file_put_contents($rateLimitFile, json_encode($rateData));
        } else {
            @file_put_contents($rateLimitFile, json_encode(array('count' => 1, 'first_request' => time())));
        }
    }
} else {
    @file_put_contents($rateLimitFile, json_encode(array('count' => 1, 'first_request' => time())));
}

// 2. Read and decode JSON payload
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!is_array($input)) {
    $input = $_POST;
}

// 3. Honeypot Spam Protection
if (!empty($input['website_url_hp']) || !empty($input['honeypot']) || !empty($input['hp_field'])) {
    // Silently return success to spam bots without processing or storing
    echo json_encode(array(
        'success' => true,
        'message' => 'Registration received'
    ));
    exit;
}

// 4. Sanitize and Extract Fields
$participantName    = trim(strip_tags($input['participantName'] ?? ''));
$parentCaretakerName= trim(strip_tags($input['parentCaretakerName'] ?? ''));
$studyLevel         = trim(strip_tags($input['studyLevel'] ?? ''));
$gradeOrCollegeYear = trim(strip_tags($input['gradeOrCollegeYear'] ?? ''));
$institutionName    = trim(strip_tags($input['institutionName'] ?? ''));
$city               = trim(strip_tags($input['city'] ?? ''));
$contactNumber      = preg_replace('/\D/', '', $input['contactNumber'] ?? '');
$whatsappNumber     = preg_replace('/\D/', '', $input['whatsappNumber'] ?? '');
$email              = trim(filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL));

// Tracking parameters
$utmSource          = trim(strip_tags($input['utmSource'] ?? $input['utm_source'] ?? ''));
$utmMedium          = trim(strip_tags($input['utmMedium'] ?? $input['utm_medium'] ?? ''));
$utmCampaign        = trim(strip_tags($input['utmCampaign'] ?? $input['utm_campaign'] ?? ''));
$utmContent         = trim(strip_tags($input['utmContent'] ?? $input['utm_content'] ?? ''));
$utmTerm            = trim(strip_tags($input['utmTerm'] ?? $input['utm_term'] ?? ''));
$fbclid             = trim(strip_tags($input['fbclid'] ?? ''));
$landingPage        = trim(strip_tags($input['landingPage'] ?? 'https://vadivacreativelabs.com/techfestregistration'));
$leadSource         = trim(strip_tags($input['leadSource'] ?? ($utmSource ?: 'Meta Ads')));
$campaign           = trim(strip_tags($input['campaign'] ?? $utmCampaign));
$adSet              = trim(strip_tags($input['adSet'] ?? ''));
$ad                 = trim(strip_tags($input['ad'] ?? ''));

// 5. Server-Side Validation
$errors = array();

if (empty($participantName)) {
    $errors[] = 'Participant name is required.';
}
if (empty($parentCaretakerName)) {
    $errors[] = 'Parent / caretaker name is required.';
}
if (empty($studyLevel) || !in_array($studyLevel, array('School Students', 'College Students'))) {
    $errors[] = 'Please select a valid level of study.';
}
if (empty($gradeOrCollegeYear)) {
    $errors[] = 'Grade or college year is required.';
}
if (empty($institutionName)) {
    $errors[] = 'Institution name is required.';
}
if (empty($city)) {
    $errors[] = 'City is required.';
}
if (empty($contactNumber) || !preg_match('/^[6-9]\d{9}$/', $contactNumber)) {
    $errors[] = 'Please provide a valid 10-digit Indian mobile number.';
}
if (!empty($whatsappNumber) && !preg_match('/^[6-9]\d{9}$/', $whatsappNumber)) {
    $errors[] = 'Please provide a valid 10-digit WhatsApp mobile number.';
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please provide a valid email address.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'error' => implode(' ', $errors),
        'details' => $errors
    ));
    exit;
}

// 6. Duplicate Submission Protection Cache (Fast Server Check)
$duplicateCacheFile = sys_get_temp_dir() . '/techfest_dup_' . md5(strtolower($participantName) . '_' . $contactNumber) . '.txt';
if (file_exists($duplicateCacheFile) && (time() - filemtime($duplicateCacheFile) < 86400)) {
    // Submitted within last 24 hours
    $regId = 'VTF26-' . strtoupper(substr(md5(strtolower($participantName) . $contactNumber), 0, 8));
    echo json_encode(array(
        'success' => true,
        'isDuplicate' => true,
        'message' => 'We already received a registration for this participant. Our team will contact you shortly.',
        'participant' => $participantName,
        'registrationId' => $regId
    ));
    exit;
}

// 7. Google Apps Script Web App Integration
// Target Google Sheet ID: 1_MQ_dqP3XPn67tpqU3RW4hvjcedIUItQLpA-NyQ8EDc
$gasEndpoint = getenv('TECHFEST_GAS_URL');
if (!$gasEndpoint && file_exists(__DIR__ . '/config.php')) {
    include_once __DIR__ . '/config.php';
    if (defined('TECHFEST_GAS_URL')) {
        $gasEndpoint = TECHFEST_GAS_URL;
    }
}

// Payload for Google Apps Script
$payload = array(
    'participantName'    => $participantName,
    'parentCaretakerName'=> $parentCaretakerName,
    'studyLevel'         => $studyLevel,
    'gradeOrCollegeYear' => $gradeOrCollegeYear,
    'institutionName'    => $institutionName,
    'city'               => $city,
    'contactNumber'      => $contactNumber,
    'whatsappNumber'     => $whatsappNumber ?: '-',
    'email'              => $email,
    'leadSource'         => $leadSource,
    'campaign'           => $campaign,
    'adSet'              => $adSet,
    'ad'                 => $ad,
    'utmSource'          => $utmSource,
    'utmMedium'          => $utmMedium,
    'utmCampaign'        => $utmCampaign,
    'utmContent'         => $utmContent,
    'utmTerm'            => $utmTerm,
    'fbclid'             => $fbclid,
    'landingPage'        => $landingPage
);

$forwardSuccess = false;
$gasResponse = null;

if (!empty($gasEndpoint)) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $gasEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    $rawResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($rawResponse) {
        $gasResponse = json_decode($rawResponse, true);
        if ($gasResponse && isset($gasResponse['success']) && $gasResponse['success']) {
            $forwardSuccess = true;
        } elseif ($httpCode >= 200 && $httpCode < 400) {
            $forwardSuccess = true;
        }
    }
} else {
    // If GAS Endpoint is not set yet, store lead in a secure local server backup file
    $leadsBackupDir = __DIR__ . '/../data';
    if (!is_dir($leadsBackupDir)) {
        @mkdir($leadsBackupDir, 0755, true);
    }
    $leadRecord = array_merge(array('timestamp' => date('c'), 'ip' => $ip), $payload);
    @file_put_contents($leadsBackupDir . '/techfest_leads.log', json_encode($leadRecord) . PHP_EOL, FILE_APPEND | LOCK_EX);
    $forwardSuccess = true;
}

// 8. Record duplicate prevention cache on successful processing
@file_put_contents($duplicateCacheFile, time());

// 9. Respond to Client
if ($forwardSuccess) {
    $regId = 'VTF26-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
    if ($gasResponse && !empty($gasResponse['isDuplicate'])) {
        echo json_encode(array(
            'success' => true,
            'isDuplicate' => true,
            'message' => 'We already received a registration for this participant. Our team will contact you shortly.',
            'participant' => $participantName,
            'registrationId' => $regId
        ));
    } else {
        echo json_encode(array(
            'success' => true,
            'message' => 'Lead submitted successfully',
            'participant' => $participantName,
            'registrationId' => $regId
        ));
    }
} else {
    // In case of upstream communication failure, log securely and return a safe message
    error_log('TechFest Lead Submission Upstream Failure: ' . ($curlError ?? 'Unknown error'));
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => "We couldn't complete your registration right now. Please try again."
    ));
}
