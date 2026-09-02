<?php
/**
 * TechFest Admin API - Hostinger MySQL Integration
 * Vadiva Creative Labs - Tech & Design Fest '26
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
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

$adminId = $_GET['admin_id'] ?? $input['admin_id'] ?? 0;
// Note: In development/demo, allow access if adminId is bypassed or validated
if ($adminId && $pdo) {
    try {
        $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
        $stmt->execute([$adminId]);
        $user = $stmt->fetch();
        if ($user && !in_array($user['role'], ['admin', 'festival_admin', 'developer'])) {
            sendResponse(false, 'Unauthorized. Admin access required.');
        }
    } catch (Exception $e) {}
}

if ($action === 'get_stats') {
    $stats = [
        'total_registrations' => 0,
        'confirmed_registrations' => 0,
        'total_revenue' => 0.00,
        'total_students' => 0,
        'recent_activity' => []
    ];

    if ($pdo) {
        try {
            // Total Registrations
            $stmt = $pdo->query('SELECT COUNT(*) as c FROM registrations');
            $stats['total_registrations'] = (int)($stmt->fetch()['c'] ?? 0);

            // Confirmed Registrations
            $stmt = $pdo->query('SELECT COUNT(*) as c FROM registrations WHERE registration_status = "confirmed"');
            $stats['confirmed_registrations'] = (int)($stmt->fetch()['c'] ?? 0);

            // Total Revenue
            $stmt = $pdo->query('SELECT SUM(amount) as s FROM payments WHERE status = "paid"');
            $stats['total_revenue'] = (float)($stmt->fetch()['s'] ?? 0);

            // Total Students
            $stmt = $pdo->query('SELECT COUNT(*) as c FROM students');
            $stats['total_students'] = (int)($stmt->fetch()['c'] ?? 0);

            // Recent activity
            $stmt = $pdo->query('
                SELECT r.registration_number, s.student_name, s.school_name, r.total_amount,
                       r.registration_status, p.status as payment_status, r.created_at
                FROM registrations r
                JOIN students s ON r.student_id = s.id
                LEFT JOIN payments p ON p.registration_id = r.id
                ORDER BY r.id DESC
                LIMIT 10
            ');
            $stats['recent_activity'] = $stmt->fetchAll() ?: [];
        } catch (Exception $e) {}
    }

    sendResponse(true, 'Stats loaded.', $stats);
}
elseif ($action === 'get_registrations' || $action === 'list_registrations') {
    $search = trim($_GET['search'] ?? $input['search'] ?? '');
    $regStatus = trim($_GET['registration_status'] ?? $input['registration_status'] ?? '');
    $payStatus = trim($_GET['payment_status'] ?? $input['payment_status'] ?? '');
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 25)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));

    $registrations = [];
    $totalCount = 0;

    if ($pdo) {
        try {
            $where = ['1=1'];
            $params = [];

            if (!empty($search)) {
                $where[] = '(r.registration_number LIKE ? OR s.student_name LIKE ? OR s.student_phone LIKE ? OR s.student_email LIKE ? OR s.school_name LIKE ? OR p.razorpay_payment_id LIKE ? OR p.razorpay_order_id LIKE ?)';
                $searchWild = '%' . $search . '%';
                for ($i = 0; $i < 7; $i++) {
                    $params[] = $searchWild;
                }
            }

            if (!empty($regStatus) && $regStatus !== 'all') {
                $where[] = 'r.registration_status = ?';
                $params[] = $regStatus;
            }

            if (!empty($payStatus) && $payStatus !== 'all') {
                $where[] = 'p.status = ?';
                $params[] = $payStatus;
            }

            $whereSql = implode(' AND ', $where);

            // Count
            $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM registrations r JOIN students s ON r.student_id = s.id LEFT JOIN payments p ON p.registration_id = r.id WHERE {$whereSql}");
            $countStmt->execute($params);
            $totalCount = (int)($countStmt->fetch()['cnt'] ?? 0);

            // Records
            $query = "
                SELECT r.id, r.registration_number, r.total_amount, r.registration_status, r.confirmed_at, r.created_at,
                       s.student_name, s.student_phone, s.student_email, s.school_name, s.class_name, s.parent_name, s.parent_phone,
                       p.razorpay_payment_id, p.razorpay_order_id, p.status as payment_status, p.paid_at
                FROM registrations r
                JOIN students s ON r.student_id = s.id
                LEFT JOIN payments p ON p.registration_id = r.id
                WHERE {$whereSql}
                ORDER BY r.id DESC
                LIMIT {$limit} OFFSET {$offset}
            ";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $registrations = $stmt->fetchAll() ?: [];

            // Attach workshops
            foreach ($registrations as &$reg) {
                $wStmt = $pdo->prepare('SELECT workshop_name_snapshot, workshop_price FROM registration_workshops WHERE registration_id = ?');
                $wStmt->execute([$reg['id']]);
                $reg['workshops'] = $wStmt->fetchAll() ?: [];
            }
        } catch (Exception $e) {
            sendResponse(false, 'Database error: ' . $e->getMessage());
        }
    }

    sendResponse(true, 'Registrations loaded.', [
        'total' => $totalCount,
        'limit' => $limit,
        'offset' => $offset,
        'registrations' => $registrations
    ]);
}
elseif ($action === 'list_workshops') {
    if ($pdo) {
        $stmt = $pdo->query('SELECT * FROM workshops ORDER BY id ASC');
        $workshops = $stmt->fetchAll() ?: [];
        sendResponse(true, 'Workshops loaded.', ['workshops' => $workshops]);
    }
    sendResponse(true, 'Workshops loaded.', ['workshops' => []]);
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
