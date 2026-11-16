<?php
/**
 * Vadiva Creative Labs - 2026 Flagship Events API Endpoint
 * Handles registration, Razorpay order creation, payment signature verification,
 * Google Sheets synchronization and participant status lookups.
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/event-config.php';
require_once __DIR__ . '/google-sheets-service-account.php';

// Backup storage file path
$backupFile = __DIR__ . '/event_registrations_backup.json';

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

// Helper: Generate Unique Participant UID
function generateParticipantUID($prefix) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $randomPart = '';
    for ($i = 0; $i < 4; $i++) {
        $randomPart .= $chars[random_int(0, strlen($chars) - 1)];
    }
    $counter = date('y') . mt_rand(100, 999);
    return strtoupper($prefix . '-' . $randomPart . $counter);
}

// Helper: Read and decode JSON input safely
$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true) ?: array();
$action = $_GET['action'] ?? $_POST['action'] ?? $jsonInput['action'] ?? '';

// Helper: Sync with Google Sheets via GAS or Service Account
function syncToGoogleSheets($payload) {
    // 1. Try Google Cloud Service Account if configured
    if (file_exists(GOOGLE_SERVICE_ACCOUNT_KEY)) {
        try {
            $client = new GoogleSheetsServiceAccountClient(GOOGLE_SERVICE_ACCOUNT_KEY);
            if ($client->isConfigured()) {
                $evt = getEventInfo($payload['eventName'] ?? $payload['event'] ?? '');
                if ($evt) {
                    $row = array(
                        $payload['parentName'] ?? '',
                        $payload['studentName'] ?? '',
                        $payload['schoolName'] ?? '',
                        $payload['email'] ?? $payload['emailId'] ?? '',
                        $payload['city'] ?? '',
                        $payload['participantUID'] ?? '',
                        $payload['registrationStatus'] ?? 'Confirmed',
                        $payload['paymentStatus'] ?? 'Paid',
                        date('Y-m-d H:i:s')
                    );
                    $client->appendRow(EVENT_SPREADSHEET_ID, $evt['tabName'], $row);

                    // Also append to Payments tab
                    $payRow = array(
                        'REG-' . date('ymd') . '-' . ($payload['participantUID'] ?? ''),
                        $payload['participantUID'] ?? '',
                        $evt['title'],
                        $payload['studentName'] ?? '',
                        $payload['email'] ?? '',
                        $evt['feeINR'],
                        'INR',
                        $payload['razorpayOrderId'] ?? '',
                        $payload['razorpayPaymentId'] ?? '',
                        $payload['paymentStatus'] ?? 'Paid',
                        date('Y-m-d H:i:s')
                    );
                    $client->appendRow(EVENT_SPREADSHEET_ID, 'Payments', $payRow);
                    return array('success' => true, 'provider' => 'service_account');
                }
            }
        } catch (Exception $e) {
            error_log("Google Service Account sync error: " . $e->getMessage());
        }
    }

    // 2. Try Google Apps Script Web App
    $gasUrl = EVENT_GAS_URL;
    if ($gasUrl && strpos($gasUrl, 'AKfy') !== false) {
        $ch = curl_init($gasUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        $res = curl_exec($ch);
        curl_close($ch);
        if ($res) {
            $json = json_decode($res, true);
            if ($json) return $json;
        }
    }

    return array('success' => true, 'provider' => 'local_backup');
}

// Helper: Save to local persistent JSON backup
function saveToLocalBackup($record) {
    global $backupFile;
    $existing = array();
    if (file_exists($backupFile)) {
        $existing = json_decode(@file_get_contents($backupFile), true) ?: array();
    }
    
    // Check if updating existing by UID
    $updated = false;
    foreach ($existing as $idx => $item) {
        if (!empty($item['participantUID']) && $item['participantUID'] === $record['participantUID']) {
            $existing[$idx] = array_merge($item, $record);
            $updated = true;
            break;
        }
    }
    if (!$updated) {
        $existing[] = $record;
    }
    @file_put_contents($backupFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return true;
}

// -------------------------------------------------------------
// ACTION 1: CREATE RAZORPAY ORDER & PRE-REGISTER
// -------------------------------------------------------------
if ($action === 'create-order') {
    if (!checkRateLimit('create_order', 20, 60)) {
        http_response_code(429);
        echo json_encode(array('success' => false, 'error' => 'Too many requests. Please wait a moment.'));
        exit;
    }

    $input = !empty($jsonInput) ? $jsonInput : $_POST;

    // Strict 5-field extraction and sanitization
    $parentName  = trim(strip_tags($input['parentName'] ?? ''));
    $studentName = trim(strip_tags($input['studentName'] ?? ''));
    $schoolName  = trim(strip_tags($input['schoolName'] ?? ''));
    $email       = trim(filter_var($input['email'] ?? $input['emailId'] ?? '', FILTER_SANITIZE_EMAIL));
    $city        = trim(strip_tags($input['city'] ?? ''));
    $eventSlug   = trim($input['event'] ?? $input['eventSlug'] ?? $input['eventName'] ?? '');

    // Validation: All 5 fields required
    $errors = array();
    if (empty($parentName))  $errors[] = 'Parent Name is required.';
    if (empty($studentName)) $errors[] = 'Student Name is required.';
    if (empty($schoolName))  $errors[] = 'School Name is required.';
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid Email address is required.';
    if (empty($city))        $errors[] = 'City is required.';

    $eventInfo = getEventInfo($eventSlug);
    if (!$eventInfo) {
        $errors[] = 'Invalid or unrecognized event.';
    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => implode(' ', $errors), 'details' => $errors));
        exit;
    }

    $amountPaise = $eventInfo['amountPaise'];
    $participantUID = generateParticipantUID($eventInfo['prefix']);
    $receipt = 'rcpt_' . strtolower($eventInfo['prefix']) . '_' . time();

    // Call Razorpay Order Creation API
    $keyId = EVENT_RAZORPAY_KEY_ID;
    $keySecret = EVENT_RAZORPAY_KEY_SECRET;

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array(
        'amount' => $amountPaise,
        'currency' => 'INR',
        'receipt' => $receipt,
        'notes' => array(
            'participantUID' => $participantUID,
            'eventName' => $eventInfo['title'],
            'studentName' => $studentName,
            'parentName' => $parentName,
            'schoolName' => $schoolName,
            'city' => $city,
            'email' => $email
        )
    )));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    $orderData = json_decode($response, true);

    if ($httpCode >= 200 && $httpCode < 300 && !empty($orderData['id'])) {
        $orderId = $orderData['id'];

        // Save provisional registration to backup and sheet
        $record = array(
            'participantUID' => $participantUID,
            'eventName' => $eventInfo['title'],
            'eventSlug' => $eventInfo['id'],
            'parentName' => $parentName,
            'studentName' => $studentName,
            'schoolName' => $schoolName,
            'email' => $email,
            'city' => $city,
            'amountINR' => $eventInfo['feeINR'],
            'razorpayOrderId' => $orderId,
            'razorpayPaymentId' => '',
            'registrationStatus' => 'Pending',
            'paymentStatus' => 'Pending',
            'createdAt' => date('Y-m-d H:i:s')
        );

        saveToLocalBackup($record);

        // Also asynchronously notify Google Sheets
        syncToGoogleSheets(array_merge($record, array('action' => 'register')));

        echo json_encode(array(
            'success' => true,
            'order_id' => $orderId,
            'key_id' => $keyId,
            'amount' => $amountPaise,
            'currency' => 'INR',
            'participantUID' => $participantUID,
            'event' => $eventInfo,
            'participant' => array(
                'parentName' => $parentName,
                'studentName' => $studentName,
                'schoolName' => $schoolName,
                'email' => $email,
                'city' => $city
            )
        ));
    } else {
        http_response_code(502);
        echo json_encode(array(
            'success' => false,
            'error' => 'Failed to initialize payment gateway order: ' . ($orderData['error']['description'] ?? $curlErr ?? 'Razorpay API Error')
        ));
    }
    exit;
}

// -------------------------------------------------------------
// ACTION 2: VERIFY PAYMENT SIGNATURE & CONFIRM
// -------------------------------------------------------------
if ($action === 'verify-payment') {
    $input = !empty($jsonInput) ? $jsonInput : $_POST;

    $orderId = trim($input['razorpay_order_id'] ?? '');
    $paymentId = trim($input['razorpay_payment_id'] ?? '');
    $signature = trim($input['razorpay_signature'] ?? '');
    $uid = trim($input['participantUID'] ?? '');

    if (empty($orderId) || empty($paymentId) || empty($signature)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Missing payment verification credentials.'));
        exit;
    }

    $keySecret = EVENT_RAZORPAY_KEY_SECRET;
    $generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);

    if (!hash_equals($generatedSignature, $signature)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Invalid payment signature. Verification failed.'));
        exit;
    }

    // Update local backup
    $updatedRecord = null;
    if (file_exists($backupFile)) {
        $backupList = json_decode(@file_get_contents($backupFile), true) ?: array();
        foreach ($backupList as $idx => $item) {
            if ((!empty($uid) && $item['participantUID'] === $uid) || (!empty($item['razorpayOrderId']) && $item['razorpayOrderId'] === $orderId)) {
                $backupList[$idx]['paymentStatus'] = 'Paid';
                $backupList[$idx]['registrationStatus'] = 'Confirmed';
                $backupList[$idx]['razorpayPaymentId'] = $paymentId;
                $backupList[$idx]['paidAt'] = date('Y-m-d H:i:s');
                $updatedRecord = $backupList[$idx];
                break;
            }
        }
        @file_put_contents($backupFile, json_encode($backupList, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    if (!$updatedRecord) {
        $evtInfo = getEventInfo($input['eventName'] ?? '');
        $updatedRecord = array(
            'participantUID' => $uid,
            'eventName' => $evtInfo ? $evtInfo['title'] : ($input['eventName'] ?? 'Vadiva Event'),
            'studentName' => $input['studentName'] ?? '',
            'parentName' => $input['parentName'] ?? '',
            'schoolName' => $input['schoolName'] ?? '',
            'email' => $input['email'] ?? '',
            'city' => $input['city'] ?? '',
            'paymentStatus' => 'Paid',
            'registrationStatus' => 'Confirmed',
            'razorpayOrderId' => $orderId,
            'razorpayPaymentId' => $paymentId,
            'paidAt' => date('Y-m-d H:i:s')
        );
        saveToLocalBackup($updatedRecord);
    }

    // Sync confirmation to Google Sheet
    syncToGoogleSheets(array(
        'action' => 'confirmPayment',
        'participantUID' => $updatedRecord['participantUID'],
        'razorpayOrderId' => $orderId,
        'razorpayPaymentId' => $paymentId,
        'eventName' => $updatedRecord['eventName'] ?? ''
    ));

    echo json_encode(array(
        'success' => true,
        'message' => 'Payment verified successfully and registration confirmed.',
        'participantUID' => $updatedRecord['participantUID'],
        'paymentId' => $paymentId,
        'record' => $updatedRecord
    ));
    exit;
}

// -------------------------------------------------------------
// ACTION 3: REGISTRATION STATUS CHECK PORTAL LOOKUP
// -------------------------------------------------------------
if ($action === 'status' || $action === 'check-status') {
    $query = trim($_GET['uid'] ?? $_GET['email'] ?? $_GET['q'] ?? $jsonInput['query'] ?? '');

    if (empty($query)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Participant UID or Email is required for status search.'));
        exit;
    }

    $qLower = strtolower($query);
    $found = array();

    // 1. Check local persistent backup
    if (file_exists($backupFile)) {
        $backupList = json_decode(@file_get_contents($backupFile), true) ?: array();
        foreach ($backupList as $item) {
            $u = strtolower($item['participantUID'] ?? '');
            $e = strtolower($item['email'] ?? '');
            if ($u === $qLower || $e === $qLower) {
                $evt = getEventInfo($item['eventName'] ?? $item['eventSlug'] ?? '');
                $found[] = array_merge($item, array(
                    'eventDate' => $evt ? $evt['date'] : 'November / December 2026',
                    'eventTime' => $evt ? $evt['time'] : 'Full Day',
                    'eventVenue' => $evt ? $evt['venue'] : 'Vadiva Campus',
                    'eventFee' => $evt ? ('₹' . number_format($evt['feeINR'])) : '₹0'
                ));
            }
        }
    }

    // 2. Fallback to Google Sheets GAS endpoint if no local match or need fresh data
    if (empty($found) && EVENT_GAS_URL && strpos(EVENT_GAS_URL, 'AKfy') !== false) {
        $gasUrl = EVENT_GAS_URL . '?action=status&q=' . urlencode($query);
        $ch = curl_init($gasUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $resp = curl_exec($ch);
        curl_close($ch);
        if ($resp) {
            $gasJson = json_decode($resp, true);
            if (!empty($gasJson['records'])) {
                $found = $gasJson['records'];
            }
        }
    }

    if (!empty($found)) {
        echo json_encode(array(
            'success' => true,
            'count' => count($found),
            'records' => $found
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            'success' => false,
            'error' => 'No registration record found for the provided Participant UID or Email. Please check your spelling or contact support at +91 72009 81134.'
        ));
    }
    exit;
}

// Default fallback
http_response_code(400);
echo json_encode(array('success' => false, 'error' => 'Unknown action or invalid request parameters.'));
