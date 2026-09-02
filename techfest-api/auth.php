<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'get_config') {
    sendResponse(true, 'Config loaded', [
        'test_mode' => defined('TEST_MODE') ? TEST_MODE : false,
        'app_env' => defined('TF_APP_ENV') ? TF_APP_ENV : 'production'
    ]);
}
elseif ($action === 'register_request') {
    $mobile = $input['mobile'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($mobile) || empty($email) || empty($password)) {
        sendResponse(false, 'Mobile, email, and password are required.');
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE mobile = ? OR email = ?');
    $stmt->execute([$mobile, $email]);
    if ($stmt->fetch()) {
        sendResponse(false, 'Unable to complete verification. Please check the details and try again.');
    }

    $otp = sprintf("%06d", mt_rand(1, 999999));
    $otpHash = password_hash($otp, PASSWORD_DEFAULT);
    
    // Send OTP via SMS provider here using getenv('SMS_API_KEY')
    if (!TEST_MODE) {
        // ACTUAL SMS PROVIDER CALL GOES HERE
    }

    $stmt = $pdo->prepare('INSERT INTO otp_verifications (mobile, purpose, otp_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))');
    $stmt->execute([$mobile, 'registration', $otpHash]);

    sendResponse(true, 'OTP sent successfully.');
}
elseif ($action === 'register_verify') {
    $mobile = $input['mobile'] ?? '';
    $otp = $input['otp'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $bypassKey = $input['bypass_key'] ?? '';

    if (empty($mobile) || empty($email) || empty($password)) {
        sendResponse(false, 'Mobile, email, and password are required.');
    }

    // Centralized Test Mode Verification
    $isBypass = false;
    if (TEST_MODE) {
        $isBypass = isTestModeActive($bypassKey) 
                 || isTestModeActive($otp) 
                 || ($otp === TEST_OTP && isTestModeActive($bypassKey));
    }

    if (!$isBypass) {
        if (empty($otp)) {
            sendResponse(false, 'OTP is required.');
        }

        $stmt = $pdo->prepare('SELECT * FROM otp_verifications WHERE mobile = ? AND purpose = ? AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1');
        $stmt->execute([$mobile, 'registration']);
        $record = $stmt->fetch();

        if (!$record || strtotime($record['expires_at']) < time() || !password_verify($otp, $record['otp_hash'])) {
            if ($record) {
                $pdo->prepare('UPDATE otp_verifications SET attempt_count = attempt_count + 1 WHERE id = ?')->execute([$record['id']]);
            }
            sendResponse(false, 'Invalid or expired OTP.');
        }

        $pdo->prepare('UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?')->execute([$record['id']]);
    }

    // Duplicate account check
    $stmt = $pdo->prepare('SELECT id FROM users WHERE mobile = ? OR email = ?');
    $stmt->execute([$mobile, $email]);
    if ($stmt->fetch()) {
        sendResponse(false, 'An account with this mobile number or email already exists.');
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    try {
        $stmt = $pdo->prepare('INSERT INTO users (mobile, email, password_hash, mobile_verified_at) VALUES (?, ?, ?, NOW())');
        $stmt->execute([$mobile, $email, $passwordHash]);
        $userId = $pdo->lastInsertId();
        
        sendResponse(true, 'Account created successfully.', ['user_id' => $userId]);
    } catch (PDOException $e) {
        sendResponse(false, 'Unable to complete registration. Please check the details and try again.');
    }
}
elseif ($action === 'login') {
    $mobile = $input['mobile'] ?? '';
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare('SELECT id, password_hash, role FROM users WHERE mobile = ?');
    $stmt->execute([$mobile]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $token = bin2hex(random_bytes(32)); 
        
        // Fetch participant profile ID if exists
        $pStmt = $pdo->prepare('SELECT id FROM participants WHERE user_id = ?');
        $pStmt->execute([$user['id']]);
        $participant = $pStmt->fetch();
        $participantId = $participant ? $participant['id'] : null;

        sendResponse(true, 'Login successful.', [
            'user_id' => $user['id'], 
            'role' => $user['role'], 
            'token' => $token,
            'participant_id' => $participantId ?: $user['id']
        ]);
    }

    sendResponse(false, 'Invalid credentials.');
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
