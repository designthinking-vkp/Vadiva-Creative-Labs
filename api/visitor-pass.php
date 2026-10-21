<?php
/**
 * Protospark 2026 - Visitor Pass Management API Endpoint
 * Handles public visitor registration, pass verification, admin authentication,
 * and secure interaction with Google Sheets via Google Apps Script.
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Load configuration
require_once __DIR__ . '/config.php';

$gasUrl = defined('PROTOSPARK_GAS_URL') ? PROTOSPARK_GAS_URL : 'https://script.google.com/macros/s/AKfycby2JL8sKCi_8W0-53VE8aovpU570RbSYldQkVwq2D1v9QDy_9TbJNlZ2JUy1LhufiBE/exec';
$adminUsername = defined('PROTOSPARK_ADMIN_USERNAME') ? PROTOSPARK_ADMIN_USERNAME : 'designthinking@vkp.co.in';
$adminSecret = defined('PROTOSPARK_ADMIN_SECRET') ? PROTOSPARK_ADMIN_SECRET : 'protospark_visitor_pass_mgmt_secret_token_2026_vkp_vadiva';

// Credentials file path
$authFile = __DIR__ . '/admin_auth.json';

// Helper: Get Client IP
function getClientIp() {
    return $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

// Helper: Check Rate Limit (IP based)
function checkRateLimit($prefix, $maxRequests, $windowSeconds) {
    $ip = getClientIp();
    $cacheDir = sys_get_temp_dir() . '/vadiva_rate_limits';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0777, true);
    }
    $file = $cacheDir . '/' . $prefix . '_' . md5($ip) . '.json';
    $now = time();
    $data = array('count' => 0, 'first' => $now);

    if (file_exists($file)) {
        $loaded = json_decode(@file_get_contents($file), true);
        if ($loaded && isset($loaded['count'], $loaded['first'])) {
            $data = $loaded;
        }
    }

    if ($now - $data['first'] < $windowSeconds) {
        if ($data['count'] >= $maxRequests) {
            return false;
        }
        $data['count']++;
    } else {
        $data['count'] = 1;
        $data['first'] = $now;
    }

    @file_put_contents($file, json_encode($data));
    return true;
}

// Helper: Generate Secure Session Token
function generateSessionToken($username, $mustChangePassword, $secret) {
    $header = base64_encode(json_encode(array('alg' => 'HS256', 'typ' => 'JWT')));
    $payload = base64_encode(json_encode(array(
        'sub' => $username,
        'role' => 'admin',
        'mustChangePassword' => $mustChangePassword,
        'iat' => time(),
        'exp' => time() + (4 * 3600) // 4 hours validity
    )));
    $signature = hash_hmac('sha256', "$header.$payload", $secret, true);
    $encodedSig = str_replace(array('+', '/', '='), array('-', '_', ''), base64_encode($signature));
    return "$header.$payload.$encodedSig";
}

// Helper: Validate Session Token
function validateSessionToken($token, $secret) {
    if (!$token) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    list($header, $payload, $providedSig) = $parts;
    $expectedSig = str_replace(array('+', '/', '='), array('-', '_', ''), base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true)));

    if (!hash_equals($expectedSig, $providedSig)) {
        return false;
    }

    $data = json_decode(base64_decode($payload), true);
    if (!$data || !isset($data['exp']) || time() > $data['exp']) {
        return false;
    }

    return $data;
}

// Helper: Get Authorization Header Token
function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

// Helper: Load Admin Credentials
function getAdminCredentials($authFile, $defaultUsername) {
    if (file_exists($authFile)) {
        $content = @file_get_contents($authFile);
        $data = json_decode($content, true);
        if ($data && isset($data['username'], $data['password_hash'])) {
            return $data;
        }
    }
    // Default initial credentials: designthinking@vkp.co.in / Admin@123
    // We mark is_initial = true so the admin is prompted to change it
    return array(
        'username' => $defaultUsername,
        'password_hash' => password_hash('Admin@123', PASSWORD_BCRYPT),
        'is_initial' => true,
        'created_at' => date('c')
    );
}

// Helper: Forward Request to Google Apps Script
function forwardToGas($gasUrl, $payload) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $gasUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    $response = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlErr || empty($response)) {
        return array('success' => false, 'error' => $curlErr ?: 'Empty response from backend service');
    }

    $json = json_decode($response, true);
    if (!$json) {
        return array('success' => false, 'error' => 'Invalid JSON from Google backend: ' . substr($response, 0, 100));
    }

    return array('success' => true, 'data' => $json, 'httpCode' => $httpCode);
}

// Read Action & Method
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true) ?: array();
if (empty($action) && isset($jsonInput['action'])) {
    $action = $jsonInput['action'];
}

// -------------------------------------------------------------
// ACTION 1: ADMIN LOGIN
// -------------------------------------------------------------
if ($action === 'login') {
    if (!checkRateLimit('admin_login', 5, 900)) { // Max 5 login attempts per 15 minutes
        http_response_code(429);
        echo json_encode(array('success' => false, 'error' => 'Too many failed login attempts. Please wait 15 minutes before trying again.'));
        exit;
    }

    $username = trim($jsonInput['username'] ?? $_POST['username'] ?? '');
    $password = (string)($jsonInput['password'] ?? $_POST['password'] ?? '');

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Username and password are required.'));
        exit;
    }

    $creds = getAdminCredentials($authFile, $adminUsername);

    // Generic error message to prevent username enumeration
    $isValid = false;
    $mustChange = false;

    if (hash_equals(strtolower($creds['username']), strtolower($username))) {
        if (password_verify($password, $creds['password_hash']) || (!empty($creds['is_initial']) && $password === 'Admin@123')) {
            $isValid = true;
            $mustChange = !empty($creds['is_initial']);
        }
    }

    if (!$isValid) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Invalid credentials. Please verify and try again.'));
        exit;
    }

    $token = generateSessionToken($creds['username'], $mustChange, $adminSecret);
    echo json_encode(array(
        'success' => true,
        'token' => $token,
        'mustChangePassword' => $mustChange,
        'user' => array(
            'username' => $creds['username'],
            'role' => 'Administrator'
        )
    ));
    exit;
}

// -------------------------------------------------------------
// ACTION 2: ADMIN CHANGE PASSWORD
// -------------------------------------------------------------
if ($action === 'change-password') {
    $token = getBearerToken() ?: ($jsonInput['token'] ?? '');
    $session = validateSessionToken($token, $adminSecret);

    if (!$session) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Unauthorized. Please sign in again.'));
        exit;
    }

    $currentPassword = (string)($jsonInput['currentPassword'] ?? '');
    $newPassword = (string)($jsonInput['newPassword'] ?? '');

    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'New password must be at least 8 characters long.'));
        exit;
    }

    $creds = getAdminCredentials($authFile, $adminUsername);

    if (!password_verify($currentPassword, $creds['password_hash']) && (!empty($creds['is_initial']) && $currentPassword !== 'Admin@123')) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Current password does not match.'));
        exit;
    }

    // Hash new password securely
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT, array('cost' => 12));
    $saveData = array(
        'username' => $creds['username'],
        'password_hash' => $newHash,
        'is_initial' => false,
        'updated_at' => date('c')
    );

    @file_put_contents($authFile, json_encode($saveData, JSON_PRETTY_PRINT));

    $newToken = generateSessionToken($creds['username'], false, $adminSecret);
    echo json_encode(array(
        'success' => true,
        'message' => 'Password changed successfully.',
        'token' => $newToken
    ));
    exit;
}

// -------------------------------------------------------------
// ACTION 3: ADMIN LOGOUT
// -------------------------------------------------------------
if ($action === 'logout') {
    echo json_encode(array('success' => true, 'message' => 'Session logged out successfully.'));
    exit;
}

// -------------------------------------------------------------
// ACTION 4: PASS VERIFICATION (PUBLIC QR ENDPOINT)
// -------------------------------------------------------------
if ($action === 'verify') {
    $visitorId = trim($_GET['id'] ?? $jsonInput['visitorId'] ?? '');
    if (empty($visitorId)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Visitor ID is required.'));
        exit;
    }

    // Call Google Apps Script verify endpoint
    $verifyUrl = $gasUrl . '?action=verifyVisitorPass&id=' . urlencode($visitorId);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $verifyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    if ($data && isset($data['status']) && $data['status'] === 'success' && !empty($data['visitorId'])) {
        echo json_encode(array(
            'success' => true,
            'valid' => $data['valid'],
            'visitor' => array(
                'visitorId' => $data['visitorId'],
                'visitorName' => $data['visitorName'],
                'schoolName' => $data['schoolName'],
                'visitorType' => $data['visitorType'],
                'groupReference' => $data['groupReference'] ?? '',
                'registrationDate' => $data['registrationDate'] ?? '',
                'passStatus' => $data['passStatus'] ?? 'Generated',
                'registrationStatus' => $data['registrationStatus'] ?? 'Confirmed'
            )
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            'success' => false,
            'valid' => false,
            'error' => 'Visitor Pass not found or cancelled.'
        ));
    }
    exit;
}

// -------------------------------------------------------------
// ACTION 5: GET VISITOR PASS LIST (PROTECTED ADMIN ENDPOINT)
// -------------------------------------------------------------
if ($action === 'list') {
    $token = getBearerToken() ?: ($jsonInput['token'] ?? $_GET['token'] ?? '');
    $session = validateSessionToken($token, $adminSecret);

    if (!$session) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Unauthorized. Admin credentials required.'));
        exit;
    }

    $listUrl = $gasUrl . '?action=getVisitorPasses';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $listUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    if ($data && isset($data['status']) && $data['status'] === 'success') {
        echo json_encode(array(
            'success' => true,
            'count' => $data['count'] ?? count($data['records'] ?? array()),
            'records' => $data['records'] ?? array()
        ));
    } else {
        // Fallback to local backup records if GAS timed out
        $backupFile = __DIR__ . '/visitor_registrations_backup.json';
        $localRecords = array();
        if (file_exists($backupFile)) {
            $localRecords = json_decode(@file_get_contents($backupFile), true) ?: array();
        }
        echo json_encode(array(
            'success' => true,
            'count' => count($localRecords),
            'records' => $localRecords,
            'source' => 'local_cache'
        ));
    }
    exit;
}

// -------------------------------------------------------------
// ACTION 6: UPDATE STATUS (PROTECTED ADMIN ENDPOINT)
// -------------------------------------------------------------
if ($action === 'update-status') {
    $token = getBearerToken() ?: ($jsonInput['token'] ?? '');
    $session = validateSessionToken($token, $adminSecret);

    if (!$session) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Unauthorized. Admin credentials required.'));
        exit;
    }

    $visitorId = trim($jsonInput['visitorId'] ?? '');
    $newStatus = trim($jsonInput['status'] ?? 'Confirmed');

    if (empty($visitorId)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Visitor ID is required.'));
        exit;
    }

    $gasRes = forwardToGas($gasUrl, array(
        'action' => 'updateVisitorPassStatus',
        'visitorId' => $visitorId,
        'registrationStatus' => $newStatus
    ));

    echo json_encode(array(
        'success' => true,
        'visitorId' => $visitorId,
        'status' => $newStatus,
        'backend' => $gasRes
    ));
    exit;
}

// -------------------------------------------------------------
// ACTION 7: PUBLIC REGISTRATION
// -------------------------------------------------------------
if ($action === 'register' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Flood protection: max 12 submissions per minute per IP
    if (!checkRateLimit('visitor_reg', 12, 60)) {
        http_response_code(429);
        echo json_encode(array('success' => false, 'error' => 'Submission rate limit reached. Please wait a moment before trying again.'));
        exit;
    }

    // 2. Honeypot check
    if (!empty($jsonInput['website_hp']) || !empty($_POST['website_hp']) || !empty($jsonInput['hp_field'])) {
        // Silently return success to bot without storing
        echo json_encode(array('success' => true, 'message' => 'Registration received.'));
        exit;
    }

    // 3. Extract & Validate Fields
    $input = !empty($jsonInput) ? $jsonInput : $_POST;
    $isTeacher = (!empty($input['isTeacher']) && ($input['isTeacher'] === true || $input['isTeacher'] === 'true' || $input['isTeacher'] === 'yes'));
    $errors = array();

    if ($isTeacher) {
        $teacherName = trim(strip_tags($input['teacherName'] ?? ''));
        $schoolName = trim(strip_tags($input['schoolName'] ?? ''));
        $teacherEmail = trim(filter_var($input['teacherEmail'] ?? '', FILTER_SANITIZE_EMAIL));
        $teacherContact = preg_replace('/[^\d+]/', '', $input['teacherContactNumber'] ?? '');
        $students = is_array($input['students'] ?? null) ? $input['students'] : array();

        if (empty($teacherName)) $errors[] = 'Teacher name is required.';
        if (empty($schoolName)) $errors[] = 'School name is required.';
        if (empty($teacherEmail) || !filter_var($teacherEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid teacher email is required.';
        if (empty($teacherContact) || strlen($teacherContact) < 8) $errors[] = 'Valid teacher contact number is required.';

        if (empty($students)) {
            $errors[] = 'At least one student must be registered under teacher registration.';
        } elseif (count($students) > 50) {
            $errors[] = 'Maximum 50 students allowed per registration session.';
        } else {
            foreach ($students as $idx => $st) {
                $stName = trim(strip_tags($st['studentName'] ?? ''));
                if (empty($stName)) {
                    $errors[] = "Student #" . ($idx + 1) . " name is required.";
                }
            }
        }
    } else {
        $fullName = trim(strip_tags($input['fullName'] ?? ''));
        $schoolName = trim(strip_tags($input['schoolName'] ?? ''));
        $email = trim(filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL));
        $contactNumber = preg_replace('/[^\d+]/', '', $input['contactNumber'] ?? '');

        if (empty($fullName)) $errors[] = 'Full name is required.';
        if (empty($schoolName)) $errors[] = 'School name is required.';
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid email address is required.';
        if (empty($contactNumber) || strlen($contactNumber) < 8) $errors[] = 'Valid contact number is required.';
    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => implode(' ', $errors), 'details' => $errors));
        exit;
    }

    // 4. Prepare payload for Google Apps Script
    $gasPayload = array(
        'action' => 'registerVisitorPass',
        'isTeacher' => $isTeacher,
        'visitorType' => $isTeacher ? 'Teacher' : 'Individual Visitor'
    );

    if ($isTeacher) {
        $gasPayload['teacherName'] = $teacherName;
        $gasPayload['schoolName'] = $schoolName;
        $gasPayload['teacherEmail'] = $teacherEmail;
        $gasPayload['teacherContactNumber'] = $teacherContact;
        $gasPayload['teacherAttending'] = !empty($input['teacherAttending']);
        $gasPayload['students'] = $students;
    } else {
        $gasPayload['fullName'] = $fullName;
        $gasPayload['schoolName'] = $schoolName;
        $gasPayload['email'] = $email;
        $gasPayload['contactNumber'] = $contactNumber;
    }

    // 5. Send to Google Apps Script
    $gasResult = forwardToGas($gasUrl, $gasPayload);

    if ($gasResult['success'] && isset($gasResult['data']['status']) && $gasResult['data']['status'] === 'success') {
        $data = $gasResult['data'];

        // Save local backup log
        $backupFile = __DIR__ . '/visitor_registrations_backup.json';
        $existingBackup = file_exists($backupFile) ? (json_decode(@file_get_contents($backupFile), true) ?: array()) : array();
        if (!empty($data['records'])) {
            foreach ($data['records'] as $rec) {
                $existingBackup[] = $rec;
            }
            @file_put_contents($backupFile, json_encode($existingBackup, JSON_PRETTY_PRINT));
        }

        echo json_encode(array(
            'success' => true,
            'message' => 'Registration completed successfully.',
            'groupId' => $data['groupId'] ?? '',
            'totalRegistered' => $data['totalRegistered'] ?? count($data['records'] ?? array()),
            'records' => $data['records'] ?? array()
        ));
    } else {
        // Handle failure safely
        $errorMsg = $gasResult['data']['message'] ?? $gasResult['error'] ?? 'Google Sheets backend error';
        http_response_code(502);
        echo json_encode(array(
            'success' => false,
            'error' => 'Unable to record registration in Google Sheets database: ' . $errorMsg
        ));
    }
    exit;
}

http_response_code(400);
echo json_encode(array('success' => false, 'error' => 'Unknown action or invalid request.'));
