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
        'test_mode' => false,
        'app_env' => defined('TF_APP_ENV') ? TF_APP_ENV : 'production'
    ]);
}
// Direct user registration using User ID / Mobile / Email & Password (No OTP, Production Mode)
elseif ($action === 'register' || $action === 'register_verify' || $action === 'register_request') {
    $mobile      = trim($input['mobile'] ?? $input['phone'] ?? $input['student_phone'] ?? $input['login_id'] ?? '');
    $email       = trim($input['email'] ?? $input['student_email'] ?? '');
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

    // Inspect columns of users table for maximum database compatibility
    $userCols = [];
    if ($pdo) {
        try {
            $colQuery = $pdo->query("SHOW COLUMNS FROM users");
            while ($row = $colQuery->fetch(PDO::FETCH_ASSOC)) {
                $userCols[] = strtolower($row['Field']);
            }
        } catch (Exception $e) {
            $userCols = ['id', 'email', 'phone', 'password_hash', 'role'];
        }
    }

    $hasPhoneCol = in_array('phone', $userCols);
    $hasMobileCol = in_array('mobile', $userCols);

    // Duplicate account check
    if ($pdo) {
        try {
            $checkSql = 'SELECT id FROM users WHERE ';
            $checkParams = [];
            $clauses = [];

            if ($hasPhoneCol && !empty($mobile)) {
                $clauses[] = 'phone = ?';
                $checkParams[] = $mobile;
            }
            if ($hasMobileCol && !empty($mobile)) {
                $clauses[] = 'mobile = ?';
                $checkParams[] = $mobile;
            }
            if (!empty($email)) {
                $clauses[] = 'email = ?';
                $checkParams[] = $email;
            }

            if (!empty($clauses)) {
                $checkSql .= '(' . implode(' OR ', $clauses) . ') LIMIT 1';
                $stmt = $pdo->prepare($checkSql);
                $stmt->execute($checkParams);
                if ($stmt->fetch()) {
                    sendResponse(false, 'An account with this Mobile Number or Email already exists. Please log in.');
                }
            }
        } catch (PDOException $e) {
            // Ignore if check fails
        }
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $userId = 0;
    $studentId = 0;
    $token = bin2hex(random_bytes(32));

    try {
        if ($pdo) {
            // Build dynamic INSERT query based on actual existing columns in users table
            $insertCols = [];
            $insertPlaceholders = [];
            $insertVals = [];

            if (in_array('email', $userCols) && !empty($email)) {
                $insertCols[] = 'email';
                $insertPlaceholders[] = '?';
                $insertVals[] = $email;
            } elseif (in_array('email', $userCols)) {
                // Generate a dummy email if column is NOT NULL and empty
                $insertCols[] = 'email';
                $insertPlaceholders[] = '?';
                $insertVals[] = $mobile ? ($mobile . '@vadiva.temp') : ('user_' . time() . '@vadiva.temp');
            }

            if ($hasPhoneCol) {
                $insertCols[] = 'phone';
                $insertPlaceholders[] = '?';
                $insertVals[] = $mobile ?: null;
            }
            if ($hasMobileCol) {
                $insertCols[] = 'mobile';
                $insertPlaceholders[] = '?';
                $insertVals[] = $mobile ?: null;
            }

            if (in_array('password_hash', $userCols)) {
                $insertCols[] = 'password_hash';
                $insertPlaceholders[] = '?';
                $insertVals[] = $passwordHash;
            }

            if (in_array('role', $userCols)) {
                $insertCols[] = 'role';
                $insertPlaceholders[] = '?';
                $insertVals[] = 'student';
            }

            if (in_array('is_active', $userCols)) {
                $insertCols[] = 'is_active';
                $insertPlaceholders[] = '1';
            }
            if (in_array('mobile_verified_at', $userCols)) {
                $insertCols[] = 'mobile_verified_at';
                $insertPlaceholders[] = 'NOW()';
            }
            if (in_array('email_verified_at', $userCols)) {
                $insertCols[] = 'email_verified_at';
                $insertPlaceholders[] = 'NOW()';
            }

            $sql = 'INSERT INTO users (' . implode(', ', $insertCols) . ') VALUES (' . implode(', ', $insertPlaceholders) . ')';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($insertVals);
            $userId = (int)$pdo->lastInsertId();

            // Insert into students table (matching Hostinger schema)
            try {
                $sStmt = $pdo->prepare('
                    INSERT INTO students (
                        user_id, student_name, student_phone, student_email,
                        parent_name, parent_phone, school_name, class_name, city, state
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Tamil Nadu")
                ');
                $sStmt->execute([
                    $userId > 0 ? $userId : null,
                    $studentName ?: 'Student',
                    $mobile ?: null,
                    $email ?: null,
                    $parentName ?: 'Parent',
                    $mobile ?: null,
                    $schoolName ?: 'School',
                    $className ?: '10',
                    $city ?: 'Chennai'
                ]);
                $studentId = (int)$pdo->lastInsertId();
            } catch (Exception $stErr) {
                // Students table insert error fallback
            }

            // Also insert into participants if table exists
            try {
                $pCheck = $pdo->query("SHOW TABLES LIKE 'participants'");
                if ($pCheck && $pCheck->rowCount() > 0) {
                    $participantPublicId = sprintf('TF-2026-%04d', $userId);
                    $gradeNum = (int)preg_replace('/[^0-9]/', '', $className) ?: 6;
                    $band = ($gradeNum <= 5) ? 'JUNIOR' : (($gradeNum <= 8) ? 'INTERMEDIATE' : 'SENIOR');
                    $tier = (stripos($schoolName, 'velammal') !== false) ? 'VELAMMAL' : 'OTHER';

                    $pStmt = $pdo->prepare('
                        INSERT INTO participants (
                            user_id, school_id, participant_id, full_name, grade, date_of_birth,
                            guardian_name, guardian_mobile, band, tier, entry_status
                        ) VALUES (?, 1, ?, ?, ?, "2010-01-01", ?, ?, ?, ?, "PENDING")
                    ');
                    $pStmt->execute([
                        $userId,
                        $participantPublicId,
                        $studentName ?: 'Student',
                        $gradeNum,
                        $parentName ?: 'Parent',
                        $mobile ?: '9999999999',
                        $band,
                        $tier
                    ]);
                }
            } catch (Exception $pErr) {
                // Ignore participants fallback
            }
        } else {
            $userId = mt_rand(1000, 9999);
            $studentId = $userId;
        }

        $publicId = sprintf('TF-2026-%04d', $userId);

        sendResponse(true, 'Account registered successfully.', [
            'user_id' => $userId,
            'student_id' => $studentId ?: $userId,
            'participant_id' => $publicId,
            'token' => $token,
            'name' => $studentName ?: $mobile
        ]);
    } catch (PDOException $e) {
        sendResponse(false, 'Unable to complete registration: ' . $e->getMessage());
    }
}
// Login using User ID / Mobile / Email & Password
elseif ($action === 'login') {
    $loginId  = trim($input['login_id'] ?? $input['user_id'] ?? $input['mobile'] ?? $input['phone'] ?? $input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($loginId) || empty($password)) {
        sendResponse(false, 'User ID / Mobile / Email and Password are required.');
    }

    if ($pdo) {
        try {
            // Detect user columns
            $userCols = [];
            try {
                $colQuery = $pdo->query("SHOW COLUMNS FROM users");
                while ($row = $colQuery->fetch(PDO::FETCH_ASSOC)) {
                    $userCols[] = strtolower($row['Field']);
                }
            } catch (Exception $e) {
                $userCols = ['id', 'email', 'phone', 'password_hash', 'role'];
            }

            $hasPhoneCol = in_array('phone', $userCols);
            $hasMobileCol = in_array('mobile', $userCols);

            $searchClauses = [];
            $searchParams = [];

            if (in_array('email', $userCols)) {
                $searchClauses[] = 'email = ?';
                $searchParams[] = $loginId;
            }
            if ($hasPhoneCol) {
                $searchClauses[] = 'phone = ?';
                $searchParams[] = $loginId;
            }
            if ($hasMobileCol) {
                $searchClauses[] = 'mobile = ?';
                $searchParams[] = $loginId;
            }
            if (is_numeric($loginId)) {
                $searchClauses[] = 'id = ?';
                $searchParams[] = (int)$loginId;
            }

            if (!empty($searchClauses)) {
                $stmt = $pdo->prepare('SELECT * FROM users WHERE ' . implode(' OR ', $searchClauses) . ' LIMIT 1');
                $stmt->execute($searchParams);
                $user = $stmt->fetch();

                if ($user && password_verify($password, $user['password_hash'])) {
                    $token = bin2hex(random_bytes(32));
                    $publicId = sprintf('TF-2026-%04d', $user['id']);
                    $userName = $user['email'] ?? ($user['phone'] ?? ($user['mobile'] ?? $publicId));

                    // Fetch student name if available
                    try {
                        $sStmt = $pdo->prepare('SELECT student_name, id FROM students WHERE user_id = ? LIMIT 1');
                        $sStmt->execute([$user['id']]);
                        $st = $sStmt->fetch();
                        if ($st && !empty($st['student_name'])) {
                            $userName = $st['student_name'];
                        }
                    } catch (Exception $sErr) {}

                    sendResponse(true, 'Login successful.', [
                        'user_id' => $user['id'],
                        'role' => $user['role'] ?? 'student',
                        'token' => $token,
                        'participant_id' => $publicId,
                        'name' => $userName
                    ]);
                }
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
