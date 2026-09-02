<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

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
// Direct user registration using User ID / Mobile / Email & Password (No OTP)
elseif ($action === 'register' || $action === 'register_verify' || $action === 'register_request') {
    $mobile      = trim($input['mobile'] ?? $input['phone'] ?? $input['login_id'] ?? '');
    $email       = trim($input['email'] ?? '');
    $password    = $input['password'] ?? '';
    $studentName = trim($input['student_name'] ?? $input['name'] ?? $input['full_name'] ?? '');
    $parentName  = trim($input['parent_name'] ?? $input['guardian_name'] ?? '');
    $schoolName  = trim($input['school_name'] ?? $input['school'] ?? '');
    $className   = trim($input['class_name'] ?? $input['grade'] ?? '');
    $city        = trim($input['city'] ?? 'Chennai');

    if (empty($password)) {
        sendResponse(false, 'Password is required.');
    }
    if (strlen($password) < 6) {
        sendResponse(false, 'Password must be at least 6 characters.');
    }
    if (empty($mobile) && empty($email)) {
        sendResponse(false, 'Mobile number or User ID / Email is required.');
    }

    // Duplicate account check
    if ($pdo) {
        try {
            $stmt = $pdo->prepare('SELECT id FROM users WHERE (mobile = ? AND mobile != "") OR (email = ? AND email != "")');
            $stmt->execute([$mobile, $email]);
            if ($stmt->fetch()) {
                sendResponse(false, 'An account with this Mobile Number or Email already exists. Please log in.');
            }
        } catch (PDOException $e) {
            // Ignore if check fails
        }
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $userId = 0;
    $participantId = '';
    $token = bin2hex(random_bytes(32));

    try {
        if ($pdo) {
            $stmt = $pdo->prepare('INSERT INTO users (mobile, email, password_hash, role, mobile_verified_at, email_verified_at) VALUES (?, ?, ?, "participant", NOW(), NOW())');
            $stmt->execute([$mobile ?: null, $email ?: null, $passwordHash]);
            $userId = (int)$pdo->lastInsertId();
            $participantId = sprintf('TF-2026-%04d', $userId);

            // Create participant profile record if student details provided
            if (!empty($studentName) && $userId > 0) {
                try {
                    // Check or insert school
                    $schoolId = 1;
                    if (!empty($schoolName)) {
                        $sStmt = $pdo->prepare('SELECT id FROM schools WHERE name = ? LIMIT 1');
                        $sStmt->execute([$schoolName]);
                        $sRow = $sStmt->fetch();
                        if ($sRow) {
                            $schoolId = $sRow['id'];
                        } else {
                            $tier = (stripos($schoolName, 'velammal') !== false) ? 'VELAMMAL' : 'OTHER';
                            $insSchool = $pdo->prepare('INSERT INTO schools (name, tier, city) VALUES (?, ?, ?)');
                            $insSchool->execute([$schoolName, $tier, $city]);
                            $schoolId = (int)$pdo->lastInsertId();
                        }
                    }

                    $gradeNum = (int)preg_replace('/[^0-9]/', '', $className) ?: 6;
                    $band = ($gradeNum <= 5) ? 'JUNIOR' : (($gradeNum <= 8) ? 'INTERMEDIATE' : 'SENIOR');
                    $tier = (stripos($schoolName, 'velammal') !== false) ? 'VELAMMAL' : 'OTHER';

                    $pStmt = $pdo->prepare('
                        INSERT INTO participants (
                            user_id, school_id, participant_id, full_name, grade, date_of_birth,
                            guardian_name, guardian_mobile, band, tier, entry_status
                        ) VALUES (?, ?, ?, ?, ?, "2010-01-01", ?, ?, ?, ?, "PENDING")
                    ');
                    $pStmt->execute([
                        $userId,
                        $schoolId,
                        $participantId,
                        $studentName,
                        $gradeNum,
                        $parentName ?: 'Parent',
                        $mobile ?: '9999999999',
                        $band,
                        $tier
                    ]);
                } catch (Exception $pErr) {
                    // Participant table insert error fallback
                }
            }
        } else {
            $userId = mt_rand(1000, 9999);
            $participantId = 'TF-2026-' . $userId;
        }

        sendResponse(true, 'Account registered successfully.', [
            'user_id' => $userId,
            'participant_id' => $participantId ?: ('TF-2026-' . $userId),
            'token' => $token,
            'name' => $studentName ?: $mobile
        ]);
    } catch (PDOException $e) {
        sendResponse(false, 'Unable to complete registration: ' . $e->getMessage());
    }
}
// Login using User ID / Mobile / Email & Password
elseif ($action === 'login') {
    $loginId  = trim($input['login_id'] ?? $input['user_id'] ?? $input['mobile'] ?? $input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($loginId) || empty($password)) {
        sendResponse(false, 'User ID / Mobile / Email and Password are required.');
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare('
                SELECT u.id, u.mobile, u.email, u.password_hash, u.role,
                       p.id AS participant_db_id, p.participant_id, p.full_name
                FROM users u
                LEFT JOIN participants p ON p.user_id = u.id
                WHERE u.mobile = ? OR u.email = ? OR u.id = ? OR p.participant_id = ?
                LIMIT 1
            ');
            $stmt->execute([$loginId, $loginId, is_numeric($loginId) ? (int)$loginId : 0, $loginId]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                $token = bin2hex(random_bytes(32));
                $participantId = $user['participant_id'] ?: ($user['participant_db_id'] ? sprintf('TF-2026-%04d', $user['participant_db_id']) : sprintf('TF-2026-%04d', $user['id']));

                sendResponse(true, 'Login successful.', [
                    'user_id' => $user['id'],
                    'role' => $user['role'],
                    'token' => $token,
                    'participant_id' => $participantId,
                    'name' => $user['full_name'] ?: ($user['mobile'] ?: $user['email'])
                ]);
            }
        } catch (PDOException $e) {
            sendResponse(false, 'Database error during login.');
        }
    }

    sendResponse(false, 'Invalid User ID or Password.');
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
