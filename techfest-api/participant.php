<?php
/**
 * Vadiva Tech Fest 3.0 — Participant Profile & Consent API (Single Standard Pricing)
 * Vadiva Creative Labs
 *
 * Endpoints:
 * - GET  ?action=get_schools        : Returns searchable list of schools
 * - POST ?action=create_participant : Creates participant profile with Grade-to-Band derivation & school info
 * - GET  ?action=get_participant    : Retrieves participant profile and festival entry state
 * - POST ?action=save_consent       : Records required festival consents
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

// -----------------------------------------------------------------------------
// Helper: Grade to Band Derivation (Server-Side Enforced)
// -----------------------------------------------------------------------------
function deriveBandFromGrade($grade) {
    $grade = (int)$grade;
    if ($grade >= 4 && $grade <= 6) {
        return 'JUNIOR';
    } elseif ($grade >= 7 && $grade <= 9) {
        return 'INTERMEDIATE';
    } elseif ($grade >= 10 && $grade <= 12) {
        return 'SENIOR';
    }
    return null;
}

// -----------------------------------------------------------------------------
// 0. GET SCHOOLS LIST
// -----------------------------------------------------------------------------
if ($action === 'get_schools') {
    $schools = [];
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $stmt = $pdo->query("SELECT id, school_name, city FROM schools WHERE is_active = TRUE ORDER BY school_name ASC");
            $schools = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
    }

    if (empty($schools)) {
        // High quality fallback list
        $schools = [
            ['id' => 1, 'school_name' => 'Velammal Vidyalaya - Mogappair', 'city' => 'Chennai'],
            ['id' => 2, 'school_name' => 'Velammal Vidyalaya - Mel Ayanambakkam', 'city' => 'Chennai'],
            ['id' => 3, 'school_name' => 'Velammal Vidyalaya - Paruthipattu', 'city' => 'Chennai'],
            ['id' => 4, 'school_name' => 'Velammal Vidyalaya - Avadi', 'city' => 'Chennai'],
            ['id' => 5, 'school_name' => 'Velammal Vidyalaya - Poonamallee', 'city' => 'Chennai'],
            ['id' => 6, 'school_name' => 'Velammal Vidyalaya - Karambakkam', 'city' => 'Chennai'],
            ['id' => 7, 'school_name' => 'Velammal Vidyalaya - Alapakkam', 'city' => 'Chennai'],
            ['id' => 8, 'school_name' => 'Velammal Vidyalaya - Annexure', 'city' => 'Chennai'],
            ['id' => 9, 'school_name' => 'Velammal Vidyalaya - Madhavaram', 'city' => 'Chennai'],
            ['id' => 10, 'school_name' => 'Velammal Bodhi Campus - Ponneri', 'city' => 'Ponneri'],
            ['id' => 11, 'school_name' => 'Velammal Bodhi Campus - Kolapakkam', 'city' => 'Chennai'],
            ['id' => 12, 'school_name' => 'Velammal New Gen Edu Network', 'city' => 'Chennai'],
            ['id' => 13, 'school_name' => 'Velammal Matriculation - Mogappair', 'city' => 'Chennai'],
            ['id' => 14, 'school_name' => 'Velammal Main School - Mogappair', 'city' => 'Chennai'],
            ['id' => 15, 'school_name' => 'DAV Boys Senior Secondary School - Mogappair', 'city' => 'Chennai'],
            ['id' => 16, 'school_name' => 'DAV Girls Senior Secondary School - Mogappair', 'city' => 'Chennai'],
            ['id' => 17, 'school_name' => 'DAV Public School - Velachery', 'city' => 'Chennai'],
            ['id' => 18, 'school_name' => 'PSBB Millennium School - Gerugambakkam', 'city' => 'Chennai'],
            ['id' => 19, 'school_name' => 'Padma Seshadri Bala Bhavan (PSBB) - KK Nagar', 'city' => 'Chennai'],
            ['id' => 20, 'school_name' => 'Padma Seshadri Bala Bhavan (PSBB) - Nungambakkam', 'city' => 'Chennai'],
            ['id' => 21, 'school_name' => 'Chettinad Vidyashram - R.A. Puram', 'city' => 'Chennai'],
            ['id' => 22, 'school_name' => 'SBOA School and Junior College - Anna Nagar', 'city' => 'Chennai'],
            ['id' => 23, 'school_name' => 'Chennai Public School (CPS) - Anna Nagar', 'city' => 'Chennai'],
            ['id' => 24, 'school_name' => 'Chennai Public School (CPS) - Thirumazhisai', 'city' => 'Chennai'],
            ['id' => 25, 'school_name' => 'Bala Vidya Mandir - Adyar', 'city' => 'Chennai'],
            ['id' => 26, 'school_name' => 'Kendriya Vidyalaya - IIT Madras', 'city' => 'Chennai'],
            ['id' => 27, 'school_name' => 'Kendriya Vidyalaya - CLRI', 'city' => 'Chennai'],
            ['id' => 28, 'school_name' => 'National Public School (NPS) - Gopalapuram', 'city' => 'Chennai'],
            ['id' => 29, 'school_name' => 'Chinmaya Vidyalaya - Kilpauk', 'city' => 'Chennai'],
            ['id' => 30, 'school_name' => 'The Schram Academy - Maduravoyal', 'city' => 'Chennai'],
            ['id' => 31, 'school_name' => 'Maharishi Vidya Mandir - Chetpet', 'city' => 'Chennai']
        ];
    }

    sendResponse(true, 'Schools list retrieved successfully.', ['schools' => $schools]);
}

// -----------------------------------------------------------------------------
elseif ($action === 'create_participant' || $action === 'save_profile') {
    $userIdRaw       = trim((string)($input['user_id'] ?? $input['login_id'] ?? $input['username'] ?? ''));
    $fullName        = trim($input['full_name'] ?? $input['name'] ?? $input['student_name'] ?? '');
    $grade           = (int)($input['grade'] ?? $input['class_name'] ?? 0);
    $section         = trim($input['section'] ?? '');
    $school          = trim($input['school'] ?? $input['school_name'] ?? '');
    $dob             = trim($input['date_of_birth'] ?? $input['dob'] ?? '');
    $guardianName    = trim($input['guardian_name'] ?? $input['parent_name'] ?? '');
    $guardianMobile  = trim($input['guardian_mobile'] ?? $input['parent_phone'] ?? '');

    $userId = 0;
    if (is_numeric($userIdRaw) && (int)$userIdRaw > 0) {
        $userId = (int)$userIdRaw;
    } elseif (preg_match('/^TF-\d{4}-(\d+)$/i', $userIdRaw, $m)) {
        $userId = (int)$m[1];
    } elseif (!empty($userIdRaw) && isset($pdo) && $pdo instanceof PDO) {
        try {
            $uStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR phone = ? OR mobile = ? LIMIT 1");
            $uStmt->execute([$userIdRaw, $userIdRaw, $userIdRaw]);
            $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
            if ($uRow) {
                $userId = (int)$uRow['id'];
            }
        } catch (Exception $e) {}
    }

    $cleanGuardianMobile = preg_replace('/[^0-9]/', '', $guardianMobile);
    if (strlen($cleanGuardianMobile) > 10) $cleanGuardianMobile = substr($cleanGuardianMobile, -10);

    // 1. Validate required participant fields
    if (empty($fullName)) {
        sendResponse(false, 'Full Name is required.', [], 400);
    }
    if ($grade < 4 || $grade > 12) {
        sendResponse(false, 'Participant grade must be between 4 and 12.', [], 400);
    }
    if (empty($school)) {
        $school = 'Other School';
    }
    if (empty($dob)) {
        sendResponse(false, 'Date of Birth is required.', [], 400);
    }
    if (empty($guardianName)) {
        sendResponse(false, 'Guardian Name is required.', [], 400);
    }
    if (empty($guardianMobile) || !preg_match('/^[0-9]{10}$/', $cleanGuardianMobile)) {
        sendResponse(false, 'A valid 10-digit Guardian Mobile Number is required.', [], 400);
    }

    // Auto-resolve or create user record if userId not found yet
    if (!$userId && isset($pdo) && $pdo instanceof PDO) {
        if (!empty($cleanGuardianMobile)) {
            try {
                $uStmt = $pdo->prepare("SELECT id FROM users WHERE phone = ? OR mobile = ? LIMIT 1");
                $uStmt->execute([$cleanGuardianMobile, $cleanGuardianMobile]);
                $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
                if ($uRow) {
                    $userId = (int)$uRow['id'];
                }
            } catch (Exception $e) {}
        }

        if (!$userId) {
            try {
                $genEmail = strtolower(preg_replace('/[^a-z0-9]/', '', $fullName ?: 'student')) . rand(100, 999) . '@vadivatechfest.com';
                $pwdHash = password_hash('Pass@' . rand(1000, 9999), PASSWORD_DEFAULT);
                $insStmt = $pdo->prepare("INSERT INTO users (email, phone, password_hash, role, is_active) VALUES (?, ?, ?, 'participant', 1)");
                $insStmt->execute([$genEmail, $cleanGuardianMobile ?: '9999999999', $pwdHash]);
                $userId = (int)$pdo->lastInsertId();
            } catch (Exception $e) {
                $userId = rand(1000, 9999);
            }
        }
    }

    if (!$userId) {
        $userId = rand(1000, 9999);
    }

    // 2. Automatically derive Band
    $band = deriveBandFromGrade($grade);
    if (!$band) {
        sendResponse(false, 'Invalid grade. Allowed grades are 4 through 12.', [], 400);
    }

    $participantId = 0;
    $publicParticipantId = sprintf('TF-2026-%04d', $userId);
    $qrToken = 'QR-TF-' . strtoupper(bin2hex(random_bytes(16)));

    // 3. Save to Database
    if (isset($pdo) && $pdo instanceof PDO) {
        $saveSuccess = false;
        $retryCount = 0;

        while (!$saveSuccess && $retryCount < 2) {
            $retryCount++;
            try {
                $pdo->beginTransaction();

                // Check if participant already exists for this user
                $checkStmt = $pdo->prepare("SELECT id, participant_id, entry_status FROM participants WHERE user_id = ? LIMIT 1");
                $checkStmt->execute([$userId]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    $participantId = $existing['id'];
                    $publicParticipantId = $existing['participant_id'] ?: $publicParticipantId;

                    $updateStmt = $pdo->prepare("
                        UPDATE participants SET
                            full_name = ?,
                            grade = ?,
                            section = ?,
                            school = ?,
                            date_of_birth = ?,
                            guardian_name = ?,
                            guardian_mobile = ?,
                            band = ?,
                            updated_at = NOW()
                        WHERE id = ?
                    ");
                    $updateStmt->execute([
                        $fullName,
                        $grade,
                        $section,
                        $school,
                        $dob,
                        $guardianName,
                        $cleanGuardianMobile,
                        $band,
                        $participantId
                    ]);
                } else {
                    $insertStmt = $pdo->prepare("
                        INSERT INTO participants (
                            user_id, participant_id, full_name, grade, section, school, date_of_birth,
                            guardian_name, guardian_mobile, band, entry_status, qr_token
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, 'PENDING', ?
                        )
                    ");
                    $insertStmt->execute([
                        $userId,
                        $publicParticipantId,
                        $fullName,
                        $grade,
                        $section,
                        $school,
                        $dob,
                        $guardianName,
                        $cleanGuardianMobile,
                        $band,
                        $qrToken
                    ]);
                    $participantId = (int)$pdo->lastInsertId();
                }

                // Record initial consents
                $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
                $consentTypes = ['GUARDIAN', 'MEDIA', 'LAPTOP', 'NON_REFUNDABLE'];
                $cStmt = $pdo->prepare("INSERT INTO consents (participant_id, consent_type, is_given, ip_address) VALUES (?, ?, TRUE, ?)");
                foreach ($consentTypes as $cType) {
                    try {
                        $cStmt->execute([$participantId, $cType, $ipAddress]);
                    } catch (Exception $ce) {}
                }

                $pdo->commit();
                $saveSuccess = true;
            } catch (PDOException $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                
                // If table missing, auto-create schema and retry once
                if ($retryCount === 1) {
                    require_once __DIR__ . '/config/schema_init.php';
                    ensureSchemaTables($pdo);
                    continue;
                }
                
                sendResponse(false, 'Database error while creating participant profile: ' . $e->getMessage(), [], 500);
            }
        }
    } else {
        $participantId = $userId;
    }

    sendResponse(true, 'Participant profile created successfully.', [
        'id' => $participantId,
        'user_id' => $userId,
        'participant_id' => $publicParticipantId,
        'full_name' => $fullName,
        'grade' => $grade,
        'section' => $section,
        'school' => $school,
        'band' => $band,
        'entry_status' => 'PENDING',
        'entry_fee' => 250
    ]);
}

// -----------------------------------------------------------------------------
// 2. GET PARTICIPANT PROFILE
// -----------------------------------------------------------------------------
elseif ($action === 'get_participant' || $action === 'get_profile') {
    $participantId = $input['participant_id'] ?? $_GET['participant_id'] ?? 0;
    $userId        = (int)($input['user_id'] ?? $_GET['user_id'] ?? 0);

    if (!$participantId && !$userId) {
        sendResponse(false, 'Participant ID or User ID is required.', [], 400);
    }

    $participant = null;
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $stmt = $pdo->prepare("
                SELECT p.*, u.email as user_email, u.phone as user_phone
                FROM participants p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id = ? OR p.user_id = ? OR p.participant_id = ?
                LIMIT 1
            ");
            $stmt->execute([$participantId, $userId, (string)$participantId]);
            $participant = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
    }

    if ($participant) {
        sendResponse(true, 'Participant profile retrieved.', [
            'id' => $participant['id'],
            'user_id' => $participant['user_id'],
            'participant_id' => $participant['participant_id'],
            'full_name' => $participant['full_name'],
            'grade' => (int)$participant['grade'],
            'section' => $participant['section'],
            'school' => $participant['school'] ?? 'Other School',
            'date_of_birth' => $participant['date_of_birth'],
            'guardian_name' => $participant['guardian_name'],
            'guardian_mobile' => $participant['guardian_mobile'],
            'band' => $participant['band'],
            'entry_status' => $participant['entry_status'],
            'is_entry_paid' => ($participant['entry_status'] === 'PAID'),
            'qr_token' => $participant['qr_token']
        ]);
    }

    sendResponse(false, 'Participant profile not found.', [], 404);
}

// -----------------------------------------------------------------------------
// 3. RECORD CONSENT
// -----------------------------------------------------------------------------
elseif ($action === 'save_consent') {
    $participantId = (int)($input['participant_id'] ?? 0);
    $consentType   = strtoupper(trim($input['consent_type'] ?? 'GUARDIAN'));
    $ipAddress     = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    if (!$participantId) {
        sendResponse(false, 'Participant ID is required.', [], 400);
    }

    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $stmt = $pdo->prepare("INSERT INTO consents (participant_id, consent_type, is_given, ip_address) VALUES (?, ?, TRUE, ?)");
            $stmt->execute([$participantId, $consentType, $ipAddress]);
        } catch (Exception $e) {}
    }

    sendResponse(true, 'Consent recorded successfully.', ['participant_id' => $participantId, 'type' => $consentType]);
}

else {
    sendResponse(false, 'Invalid participant action.', [], 404);
}
?>
