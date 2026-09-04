<?php
/**
 * Vadiva Tech Fest 3.0 — User Authentication API (User ID + Password, OTP-free)
 * Vadiva Creative Labs
 *
 * Endpoints:
 * - POST ?action=register   : Creates a user account with User ID, Password, Email, Mobile
 * - POST ?action=login      : Authenticates with User ID (or Mobile/Email) + Password
 * - GET  ?action=get_config : System runtime environment info
 * - GET  ?action=me         : Returns current session user status & participant summary
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/env.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;

function sendResponse($success, $message, $data = [], $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($action === 'get_config') {
    sendResponse(true, 'Configuration loaded', [
        'auth_method' => 'user_id_password',
        'otp_enabled' => false,
        'app_env' => defined('TF_APP_ENV') ? TF_APP_ENV : 'production'
    ]);
}

// -----------------------------------------------------------------------------
// 1. ACCOUNT CREATION (User ID, Password, Email, Mobile)
// -----------------------------------------------------------------------------
elseif ($action === 'register' || $action === 'create_account') {
    $userIdStr = trim($input['user_id'] ?? $input['username'] ?? $input['login_id'] ?? '');
    $email     = trim($input['email'] ?? '');
    $mobile    = trim($input['mobile'] ?? $input['phone'] ?? '');
    $password  = $input['password'] ?? '';

    // If user_id wasn't explicitly provided, fall back to mobile or email prefix
    if (empty($userIdStr)) {
        $userIdStr = $mobile ?: ($email ? explode('@', $email)[0] : '');
    }

    if (empty($userIdStr)) {
        sendResponse(false, 'User ID is required.', [], 400);
    }
    if (empty($password)) {
        sendResponse(false, 'Password is required.', [], 400);
    }
    if (strlen($password) < 6) {
        sendResponse(false, 'Password must be at least 6 characters.', [], 400);
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, 'A valid Email address is required.', [], 400);
    }
    if (empty($mobile) || !preg_match('/^[0-9]{10}$/', preg_replace('/[^0-9]/', '', $mobile))) {
        sendResponse(false, 'A valid 10-digit Mobile Number is required.', [], 400);
    }

    $cleanMobile = preg_replace('/[^0-9]/', '', $mobile);
    if (strlen($cleanMobile) > 10) {
        $cleanMobile = substr($cleanMobile, -10);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $newUserId = 0;
    $publicId = '';
    $token = bin2hex(random_bytes(32));

    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            // Check for existing users by email or mobile
            $checkStmt = $pdo->prepare("SELECT id, email, phone FROM users WHERE email = ? OR phone = ? OR email = ? LIMIT 1");
            $checkStmt->execute([$email, $cleanMobile, $userIdStr]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                sendResponse(false, 'An account with this Email or Mobile Number already exists. Please log in.', [], 409);
            }

            // Inspect available columns in users table
            $userCols = [];
            try {
                $colQuery = $pdo->query("SHOW COLUMNS FROM users");
                while ($row = $colQuery->fetch(PDO::FETCH_ASSOC)) {
                    $userCols[] = strtolower($row['Field']);
                }
            } catch (Exception $e) {
                $userCols = ['id', 'email', 'phone', 'password_hash', 'role', 'is_active'];
            }

            $insertCols = ['email', 'password_hash', 'role', 'is_active'];
            $insertPlaceholders = ['?', '?', '?', '1'];
            $insertVals = [$email, $passwordHash, 'participant'];

            if (in_array('phone', $userCols)) {
                $insertCols[] = 'phone';
                $insertPlaceholders[] = '?';
                $insertVals[] = $cleanMobile;
            }
            if (in_array('mobile', $userCols)) {
                $insertCols[] = 'mobile';
                $insertPlaceholders[] = '?';
                $insertVals[] = $cleanMobile;
            }

            $sql = "INSERT INTO users (" . implode(', ', $insertCols) . ") VALUES (" . implode(', ', $insertPlaceholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($insertVals);
            $newUserId = (int)$pdo->lastInsertId();

            $publicId = sprintf('TF-2026-%04d', $newUserId);

        } catch (PDOException $e) {
            sendResponse(false, 'Database error during registration: ' . $e->getMessage(), [], 500);
        }
    } else {
        $newUserId = mt_rand(1000, 9999);
        $publicId = sprintf('TF-2026-%04d', $newUserId);
    }

    sendResponse(true, 'Account created successfully.', [
        'user_id' => $newUserId,
        'login_id' => $userIdStr,
        'email' => $email,
        'mobile' => $cleanMobile,
        'participant_id' => $publicId,
        'token' => $token,
        'has_participant_profile' => false
    ]);
}

// -----------------------------------------------------------------------------
// 2. USER LOGIN (User ID + Password)
// -----------------------------------------------------------------------------
elseif ($action === 'login') {
    $loginId  = trim($input['user_id'] ?? $input['login_id'] ?? $input['username'] ?? $input['email'] ?? $input['mobile'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($loginId) || empty($password)) {
        sendResponse(false, 'User ID and Password are required.', [], 400);
    }

    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $userCols = [];
            try {
                $colQuery = $pdo->query("SHOW COLUMNS FROM users");
                while ($row = $colQuery->fetch(PDO::FETCH_ASSOC)) {
                    $userCols[] = strtolower($row['Field']);
                }
            } catch (Exception $e) {
                $userCols = ['id', 'email', 'phone', 'password_hash', 'role'];
            }

            $hasPhone = in_array('phone', $userCols);
            $hasMobile = in_array('mobile', $userCols);

            $clauses = ['email = ?'];
            $params = [$loginId];

            if ($hasPhone) {
                $clauses[] = 'phone = ?';
                $params[] = $loginId;
            }
            if ($hasMobile) {
                $clauses[] = 'mobile = ?';
                $params[] = $loginId;
            }
            if (is_numeric($loginId)) {
                $clauses[] = 'id = ?';
                $params[] = (int)$loginId;
            }

            $sql = "SELECT * FROM users WHERE (" . implode(' OR ', $clauses) . ") LIMIT 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password_hash'])) {
                $token = bin2hex(random_bytes(32));
                $publicId = sprintf('TF-2026-%04d', $user['id']);

                // Check if participant profile exists
                $participant = null;
                try {
                    $pStmt = $pdo->prepare("SELECT * FROM participants WHERE user_id = ? LIMIT 1");
                    $pStmt->execute([$user['id']]);
                    $participant = $pStmt->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $pe) {}

                sendResponse(true, 'Login successful.', [
                    'user_id' => $user['id'],
                    'login_id' => $user['email'] ?? $loginId,
                    'email' => $user['email'] ?? '',
                    'mobile' => $user['phone'] ?? ($user['mobile'] ?? ''),
                    'token' => $token,
                    'participant_id' => $participant['participant_id'] ?? $publicId,
                    'name' => $participant['full_name'] ?? ($user['email'] ?? $publicId),
                    'has_participant_profile' => (bool)$participant,
                    'tier' => $participant['tier'] ?? 'OTHER',
                    'band' => $participant['band'] ?? 'JUNIOR',
                    'entry_status' => $participant['entry_status'] ?? 'PENDING'
                ]);
            }
        } catch (PDOException $e) {
            sendResponse(false, 'Database error during login.', [], 500);
        }
    }

    sendResponse(false, 'Invalid User ID or Password.', [], 401);
}

// -----------------------------------------------------------------------------
// 3. CURRENT USER STATUS
// -----------------------------------------------------------------------------
elseif ($action === 'me') {
    $userId = (int)($input['user_id'] ?? $_GET['user_id'] ?? 0);
    if (!$userId) {
        sendResponse(false, 'User ID is required.', [], 400);
    }

    $userData = [
        'user_id' => $userId,
        'participant_id' => sprintf('TF-2026-%04d', $userId),
        'has_profile' => false
    ];

    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $pStmt = $pdo->prepare("SELECT * FROM participants WHERE user_id = ? OR id = ? LIMIT 1");
            $pStmt->execute([$userId, $userId]);
            $participant = $pStmt->fetch(PDO::FETCH_ASSOC);

            if ($participant) {
                $userData['has_profile'] = true;
                $userData['participant_id'] = $participant['participant_id'];
                $userData['name'] = $participant['full_name'];
                $userData['grade'] = $participant['grade'];
                $userData['band'] = $participant['band'];
                $userData['tier'] = $participant['tier'];
                $userData['entry_status'] = $participant['entry_status'];
                $userData['is_velammal_student'] = (bool)$participant['is_velammal_student'];
                $userData['velammal_verified'] = (bool)$participant['velammal_verified'];
                $userData['campus_name'] = $participant['campus_name'];
                $userData['admission_number'] = $participant['admission_number'];
            }
        } catch (Exception $e) {}
    }

    sendResponse(true, 'User details retrieved.', $userData);
}

else {
    sendResponse(false, 'Invalid authentication action.', [], 404);
}
?>
