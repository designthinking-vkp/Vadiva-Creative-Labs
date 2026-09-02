<?php
/**
 * TechFest Registration API - Hostinger MySQL Integration
 * Vadiva Creative Labs - Tech & Design Fest '26
 *
 * Endpoints:
 * - POST ?action=create_registration  : Creates student, registration, snapshots workshops, creates initial payment & Razorpay order
 * - GET  ?action=get_registration     : Retrieves full registration, student, workshops, and payment state
 * - GET  ?action=my_registrations     : Retrieves all registrations for the authenticated student/user
 * - GET  ?action=list_workshops       : Retrieves active workshop catalog from MySQL
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/env.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Razorpay-Signature');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;

$keyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : (getenv('RAZORPAY_KEY_ID') ?: 'rzp_live_TJc8h2vN8fM4Nx');
$keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : (getenv('RAZORPAY_KEY_SECRET') ?: 'Hwk3yDWs5Q6BBrSToRfaASd7');

// Default fallback catalog if MySQL database is in initial setup
$FALLBACK_CATALOG = [
    '1' => ['id' => 1, 'code' => 'WS-ROBOTICS', 'title' => 'Robotics & Automation', 'price' => 550.00, 'price_velammal' => 400.00, 'is_paid' => 1, 'capacity' => 40, 'venue' => 'Robotics Lab, Hall A', 'schedule' => 'Day 1 & Day 2 (10:00 AM - 01:00 PM)'],
    '2' => ['id' => 2, 'code' => 'WS-AIML', 'title' => 'AI & Machine Learning Basics', 'price' => 550.00, 'price_velammal' => 400.00, 'is_paid' => 1, 'capacity' => 40, 'venue' => 'Computer Lab 1', 'schedule' => 'Day 1 & Day 2 (02:00 PM - 05:00 PM)'],
    '3' => ['id' => 3, 'code' => 'WS-3DPRINT', 'title' => '3D Printing & Design', 'price' => 500.00, 'price_velammal' => 350.00, 'is_paid' => 1, 'capacity' => 30, 'venue' => 'Makerspace Studio', 'schedule' => 'Day 2 (10:00 AM - 01:00 PM)'],
    '4' => ['id' => 4, 'code' => 'WS-GAMEDEV', 'title' => 'Game Development', 'price' => 550.00, 'price_velammal' => 400.00, 'is_paid' => 1, 'capacity' => 35, 'venue' => 'Media & Coding Lab', 'schedule' => 'Day 2 & Day 3 (02:00 PM - 05:00 PM)'],
    '5' => ['id' => 5, 'code' => 'WS-CIRCUITS', 'title' => 'Electronics & Circuits', 'price' => 450.00, 'price_velammal' => 300.00, 'is_paid' => 1, 'capacity' => 25, 'venue' => 'Innovation Hub', 'schedule' => 'Day 1 (10:00 AM - 01:00 PM)'],
    '6' => ['id' => 6, 'code' => 'WS-PYTHON', 'title' => 'Python for Beginners', 'price' => 500.00, 'price_velammal' => 350.00, 'is_paid' => 1, 'capacity' => 40, 'venue' => 'Computer Lab 2', 'schedule' => 'Day 3 (10:00 AM - 01:00 PM)'],
    '7' => ['id' => 7, 'code' => 'WS-DESIGNTHINK', 'title' => 'Design Thinking Bootcamp', 'price' => 250.00, 'price_velammal' => 250.00, 'is_paid' => 0, 'capacity' => 80, 'venue' => 'Auditorium Hall', 'schedule' => 'Day 1 (11:00 AM - 01:00 PM)'],
    '8' => ['id' => 8, 'code' => 'WS-SKETCHING', 'title' => 'Sketching & Visual Thinking', 'price' => 250.00, 'price_velammal' => 250.00, 'is_paid' => 0, 'capacity' => 60, 'venue' => 'Design Studio', 'schedule' => 'Day 2 (11:00 AM - 01:00 PM)'],
    '9' => ['id' => 9, 'code' => 'WS-PITCHING', 'title' => 'Public Speaking & Pitching', 'price' => 250.00, 'price_velammal' => 250.00, 'is_paid' => 0, 'capacity' => 60, 'venue' => 'Seminar Hall 1', 'schedule' => 'Day 2 (02:00 PM - 04:00 PM)'],
    '10' => ['id' => 10, 'code' => 'WS-SCIENCEDEMO', 'title' => 'Science Demonstrations', 'price' => 250.00, 'price_velammal' => 250.00, 'is_paid' => 0, 'capacity' => 100, 'venue' => 'Main Stage', 'schedule' => 'Day 3 (10:00 AM - 12:00 PM)'],
    '11' => ['id' => 11, 'code' => 'WS-ENTREPRENEUR', 'title' => 'Student Entrepreneurship', 'price' => 250.00, 'price_velammal' => 250.00, 'is_paid' => 0, 'capacity' => 80, 'venue' => 'Seminar Hall 2', 'schedule' => 'Day 3 (02:00 PM - 04:30 PM)']
];

function sendApiResponse($success, $message, $data = [], $httpCode = 200) {
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
// 1. CREATE REGISTRATION
// -----------------------------------------------------------------------------
if ($action === 'create_registration') {
    $studentName   = trim($input['student_name'] ?? $input['name'] ?? $input['full_name'] ?? '');
    $studentEmail  = trim($input['student_email'] ?? $input['email'] ?? '');
    $studentPhone  = trim($input['student_phone'] ?? $input['phone'] ?? $input['mobile'] ?? '');
    $schoolName    = trim($input['school_name'] ?? $input['school'] ?? 'Vadiva Student');
    $className     = trim($input['class_name'] ?? $input['grade'] ?? '');
    $dob           = trim($input['date_of_birth'] ?? $input['dob'] ?? '');
    $gender        = trim($input['gender'] ?? '');
    $parentName    = trim($input['parent_name'] ?? $input['guardian_name'] ?? '');
    $parentPhone   = trim($input['parent_phone'] ?? $input['guardian_mobile'] ?? '');
    $parentEmail   = trim($input['parent_email'] ?? '');
    $city          = trim($input['city'] ?? 'Chennai');
    $state         = trim($input['state'] ?? 'Tamil Nadu');
    $userId        = (int)($input['user_id'] ?? 0);
    $tier          = strtoupper(trim($input['tier'] ?? 'OTHER'));

    // Check if Velammal school
    if (stripos($schoolName, 'velammal') !== false) {
        $tier = 'VELAMMAL';
    }

    // Workshop Selection (supports single workshop_id or array of workshop_ids)
    $workshopIds = [];
    if (isset($input['workshop_ids']) && is_array($input['workshop_ids'])) {
        $workshopIds = array_map('intval', $input['workshop_ids']);
    } elseif (isset($input['workshop_id'])) {
        $workshopIds = [(int)$input['workshop_id']];
    } elseif (isset($input['workshop'])) {
        $workshopIds = [(int)$input['workshop']];
    } else {
        $workshopIds = [1]; // Default workshop 1
    }

    if (empty($studentName)) {
        sendApiResponse(false, 'Student name is required.', [], 400);
    }
    if (empty($studentPhone) && empty($parentPhone)) {
        sendApiResponse(false, 'A contact mobile number is required.', [], 400);
    }
    if (empty($workshopIds)) {
        sendApiResponse(false, 'At least one workshop must be selected.', [], 400);
    }

    $workshopsToRegister = [];
    $totalAmount = 0.00;

    // Fetch workshops from MySQL or fallback catalog
    try {
        foreach ($workshopIds as $wsId) {
            $wsData = null;
            if ($pdo) {
                $stmt = $pdo->prepare('SELECT * FROM workshops WHERE id = ? AND status = "active"');
                $stmt->execute([$wsId]);
                $wsData = $stmt->fetch();
            }
            if (!$wsData && isset($FALLBACK_CATALOG[(string)$wsId])) {
                $wsData = $FALLBACK_CATALOG[(string)$wsId];
            }
            if (!$wsData) {
                sendApiResponse(false, "Workshop ID {$wsId} is invalid or closed.", [], 400);
            }

            // Price calculation strictly on server
            $price = ($tier === 'VELAMMAL' && isset($wsData['price_velammal']) && $wsData['price_velammal'] > 0)
                ? (float)$wsData['price_velammal']
                : (float)($wsData['price'] ?? 550.00);

            $totalAmount += $price;
            $workshopsToRegister[] = [
                'id' => $wsData['id'],
                'title' => $wsData['title'] ?? $wsData['name'],
                'price' => $price,
                'is_paid' => $wsData['is_paid'] ?? 1
            ];
        }
    } catch (Exception $wsErr) {
        sendApiResponse(false, 'Error retrieving workshop pricing.', [], 500);
    }

    $registrationId = 0;
    $registrationNumber = '';
    $orderId = '';
    $amountInPaise = (int)round($totalAmount * 100);

    // Database Transaction
    try {
        if ($pdo) {
            $pdo->beginTransaction();

            // 1. Insert or find Student
            $stmt = $pdo->prepare('
                INSERT INTO students (
                    user_id, student_name, date_of_birth, gender, school_name, class_name,
                    student_phone, student_email, parent_name, parent_phone, parent_email, city, state
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId > 0 ? $userId : null,
                $studentName,
                !empty($dob) ? $dob : null,
                $gender,
                $schoolName,
                $className,
                $studentPhone,
                $studentEmail,
                $parentName,
                $parentPhone,
                $parentEmail,
                $city,
                $state
            ]);
            $studentId = $pdo->lastInsertId();

            // 2. Generate unique Registration Number: VF-2026-XXXXXX
            $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM registrations');
            $regCount = (int)($stmt->fetch()['cnt'] ?? 0) + 1;
            $registrationNumber = sprintf('VF-2026-%06d', $regCount);

            // Developer Test Mode Checks
            $isTest = isTestModeActive($input['test_secret'] ?? '');
            if ($isTest) {
                $registrationNumber = sprintf('TF26-TEST-%06d', $regCount);
            }
            $env = $isTest ? 'test' : 'production';
            $paymentMode = $isTest ? 'TEST_MODE' : 'razorpay';
            $otpStatus = $isTest ? 'TEST_VERIFIED' : 'VERIFIED';
            $isTestInt = $isTest ? 1 : 0;

            // 3. Insert Registration Record
            $stmt = $pdo->prepare('
                INSERT INTO registrations (
                    registration_number, student_id, user_id, total_amount, currency, registration_status,
                    is_test_registration, environment, payment_mode, otp_status, test_session_id
                ) VALUES (?, ?, ?, ?, "INR", "pending_payment", ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $registrationNumber,
                $studentId,
                $userId > 0 ? $userId : null,
                $totalAmount,
                $isTestInt,
                $env,
                $paymentMode,
                $otpStatus,
                $isTest ? ($input['test_secret'] ?? 'TEST') : null
            ]);
            $registrationId = $pdo->lastInsertId();

            // 4. Insert Workshop Snapshots
            $stmt = $pdo->prepare('
                INSERT INTO registration_workshops (
                    registration_id, workshop_id, workshop_name_snapshot, workshop_price
                ) VALUES (?, ?, ?, ?)
            ');
            foreach ($workshopsToRegister as $ws) {
                $stmt->execute([$registrationId, $ws['id'], $ws['title'], $ws['price']]);
            }

            // 5. Create Razorpay Order
            $receiptRef = 'TF_' . $registrationId . '_' . time();
            
            if ($isTest) {
                // Bypass Razorpay API completely for test mode
                $orderId = 'TEST_ORDER_' . time() . '_' . rand(1000, 9999);
            } else {
                $ch = curl_init('https://api.razorpay.com/v1/orders');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                    'amount' => $amountInPaise,
                    'currency' => 'INR',
                    'receipt' => $receiptRef,
                    'notes' => [
                        'registration_id' => (string)$registrationId,
                        'registration_number' => $registrationNumber,
                        'student_name' => $studentName,
                        'school_name' => $schoolName,
                        'workshop_count' => count($workshopsToRegister)
                    ]
                ]));

                $rzpRes = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode >= 200 && $httpCode < 300) {
                    $rzpOrder = json_decode($rzpRes, true);
                    $orderId = $rzpOrder['id'] ?? '';
                }
            }

            // 6. Record Initial Payment & Payment Attempt
            $stmt = $pdo->prepare('
                INSERT INTO payments (
                    registration_id, user_id, gateway, amount, currency, razorpay_order_id, status
                ) VALUES (?, ?, "razorpay", ?, "INR", ?, "created")
            ');
            $stmt->execute([
                $registrationId,
                $userId > 0 ? $userId : null,
                $totalAmount,
                $orderId ?: null
            ]);

            $stmt = $pdo->prepare('
                INSERT INTO payment_attempts (
                    registration_id, razorpay_order_id, amount, currency, status
                ) VALUES (?, ?, ?, "INR", "created")
            ');
            $stmt->execute([$registrationId, $orderId ?: null, $totalAmount]);

            $pdo->commit();
        } else {
            // Fallback for offline / simulation
            $registrationId = time();
            $registrationNumber = 'VF-2026-' . rand(100000, 999999);
        }
    } catch (Exception $txnErr) {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendApiResponse(false, 'Failed to save registration: ' . $txnErr->getMessage(), [], 500);
    }

    sendApiResponse(true, 'Registration created successfully.', [
        'registration_id' => $registrationId,
        'registration_number' => $registrationNumber,
        'order_id' => $orderId,
        'key_id' => $keyId,
        'amount' => $amountInPaise,
        'amount_in_rupees' => $totalAmount,
        'currency' => 'INR',
        'student' => [
            'name' => $studentName,
            'email' => $studentEmail,
            'phone' => $studentPhone,
            'school' => $schoolName,
            'class' => $className
        ],
        'workshops' => $workshopsToRegister
    ]);
}

// -----------------------------------------------------------------------------
// 2. GET REGISTRATION DETAILS (Source of Truth for Payment, Success, Failure)
// -----------------------------------------------------------------------------
elseif ($action === 'get_registration') {
    $id = trim($input['id'] ?? $_GET['id'] ?? $input['registration_id'] ?? $_GET['registration_id'] ?? '');

    if (empty($id)) {
        sendApiResponse(false, 'Registration ID is required.', [], 400);
    }

    try {
        if ($pdo) {
            // Search by numeric ID or registration_number
            $stmt = $pdo->prepare('
                SELECT r.*, s.student_name, s.student_email, s.student_phone, s.school_name, s.class_name,
                       s.parent_name, s.parent_phone, s.city, s.state
                FROM registrations r
                JOIN students s ON r.student_id = s.id
                WHERE r.id = ? OR r.registration_number = ?
                LIMIT 1
            ');
            $stmt->execute([is_numeric($id) ? (int)$id : 0, $id]);
            $reg = $stmt->fetch();

            if (!$reg) {
                sendApiResponse(false, 'Registration record not found.', [], 404);
            }

            // Fetch workshops snapshot
            $stmt = $pdo->prepare('SELECT * FROM registration_workshops WHERE registration_id = ?');
            $stmt->execute([$reg['id']]);
            $workshops = $stmt->fetchAll();

            // Fetch payment details
            $stmt = $pdo->prepare('SELECT * FROM payments WHERE registration_id = ? ORDER BY id DESC LIMIT 1');
            $stmt->execute([$reg['id']]);
            $payment = $stmt->fetch();

            sendApiResponse(true, 'Registration retrieved.', [
                'registration_id' => $reg['id'],
                'registration_number' => $reg['registration_number'],
                'status' => $reg['registration_status'],
                'total_amount' => (float)$reg['total_amount'],
                'currency' => $reg['currency'],
                'confirmed_at' => $reg['confirmed_at'],
                'created_at' => $reg['created_at'],
                'student' => [
                    'name' => $reg['student_name'],
                    'email' => $reg['student_email'],
                    'phone' => $reg['student_phone'],
                    'school' => $reg['school_name'],
                    'class' => $reg['class_name'],
                    'parent_name' => $reg['parent_name'],
                    'parent_phone' => $reg['parent_phone'],
                    'city' => $reg['city'],
                    'state' => $reg['state']
                ],
                'workshops' => $workshops,
                'payment' => $payment ? [
                    'gateway' => $payment['gateway'],
                    'amount' => (float)$payment['amount'],
                    'status' => $payment['status'],
                    'razorpay_order_id' => $payment['razorpay_order_id'],
                    'razorpay_payment_id' => $payment['razorpay_payment_id'],
                    'paid_at' => $payment['paid_at']
                ] : null
            ]);
        }
    } catch (Exception $e) {
        sendApiResponse(false, 'Database error while retrieving registration: ' . $e->getMessage(), [], 500);
    }

    sendApiResponse(false, 'Database unavailable.', [], 503);
}

// -----------------------------------------------------------------------------
// 3. MY REGISTRATIONS (Student Dashboard)
// -----------------------------------------------------------------------------
elseif ($action === 'my_registrations') {
    $userId = (int)($input['user_id'] ?? $_GET['user_id'] ?? 0);
    $phone  = trim($input['phone'] ?? $_GET['phone'] ?? '');
    $email  = trim($input['email'] ?? $_GET['email'] ?? '');

    try {
        if ($pdo) {
            $query = '
                SELECT r.*, s.student_name, s.school_name, p.razorpay_payment_id, p.status as payment_status
                FROM registrations r
                JOIN students s ON r.student_id = s.id
                LEFT JOIN payments p ON p.registration_id = r.id
                WHERE 1=1
            ';
            $params = [];

            if ($userId > 0) {
                $query .= ' AND (r.user_id = ? OR s.user_id = ?)';
                $params[] = $userId;
                $params[] = $userId;
            } elseif (!empty($phone)) {
                $query .= ' AND (s.student_phone = ? OR s.parent_phone = ?)';
                $params[] = $phone;
                $params[] = $phone;
            } elseif (!empty($email)) {
                $query .= ' AND (s.student_email = ? OR s.parent_email = ?)';
                $params[] = $email;
                $params[] = $email;
            } else {
                // If no user identifier, return empty
                sendApiResponse(true, 'No credentials provided.', ['registrations' => []]);
            }

            $query .= ' ORDER BY r.id DESC';
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $registrations = [];
            foreach ($rows as $row) {
                // Get workshops for this registration
                $wStmt = $pdo->prepare('SELECT workshop_name_snapshot, workshop_price FROM registration_workshops WHERE registration_id = ?');
                $wStmt->execute([$row['id']]);
                $workshops = $wStmt->fetchAll();

                $registrations[] = [
                    'registration_id' => $row['id'],
                    'registration_number' => $row['registration_number'],
                    'status' => $row['registration_status'],
                    'payment_status' => $row['payment_status'] ?: 'unpaid',
                    'payment_id' => $row['razorpay_payment_id'],
                    'total_amount' => (float)$row['total_amount'],
                    'created_at' => $row['created_at'],
                    'confirmed_at' => $row['confirmed_at'],
                    'student_name' => $row['student_name'],
                    'school_name' => $row['school_name'],
                    'workshops' => $workshops
                ];
            }

            sendApiResponse(true, 'Registrations loaded.', ['registrations' => $registrations]);
        }
    } catch (Exception $e) {
        sendApiResponse(false, 'Error loading registrations: ' . $e->getMessage(), [], 500);
    }

    sendApiResponse(true, 'Registrations loaded.', ['registrations' => []]);
}

// -----------------------------------------------------------------------------
// 4. LIST WORKSHOPS FROM MYSQL
// -----------------------------------------------------------------------------
elseif ($action === 'list_workshops') {
    try {
        if ($pdo) {
            $stmt = $pdo->query('SELECT * FROM workshops WHERE status = "active" ORDER BY id ASC');
            $workshops = $stmt->fetchAll();
            if (!empty($workshops)) {
                sendApiResponse(true, 'Workshops loaded.', ['workshops' => $workshops]);
            }
        }
    } catch (Exception $e) {}

    // Fallback
    sendApiResponse(true, 'Workshops loaded.', ['workshops' => array_values($FALLBACK_CATALOG)]);
}

// -----------------------------------------------------------------------------
// INVALID ACTION
// -----------------------------------------------------------------------------
else {
    sendApiResponse(false, 'Invalid action.', [], 404);
}
?>
