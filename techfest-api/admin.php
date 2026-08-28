<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

$adminId = $_GET['admin_id'] ?? 0;
if (!$adminId) {
    sendResponse(false, 'Admin ID required.');
}

$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$adminId]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'festival_admin') {
    sendResponse(false, 'Unauthorized. Admin access required.');
}

if ($action === 'get_stats') {
    $stats = [];

    // Total registrations
    $stmt = $pdo->query('SELECT COUNT(*) as c FROM participants');
    $stats['total_participants'] = $stmt->fetch()['c'];

    // Total Revenue
    $stmt = $pdo->query('SELECT SUM(amount) as s FROM payments WHERE state = "SUCCESS"');
    $stats['total_revenue'] = $stmt->fetch()['s'] ?? 0;

    // Capacity fill rate
    $stmt = $pdo->query('SELECT SUM(capacity) as cap, SUM(seats_taken) as taken FROM batches');
    $row = $stmt->fetch();
    $stats['overall_fill_rate'] = $row['cap'] > 0 ? round(($row['taken'] / $row['cap']) * 100, 2) . '%' : 'N/A';

    sendResponse(true, 'Stats loaded.', $stats);
}
// Add other admin functions: edit_fee, edit_capacity, approve_school, cancel_booking, audit_log
else {
    sendResponse(false, 'Invalid action.');
}
?>
