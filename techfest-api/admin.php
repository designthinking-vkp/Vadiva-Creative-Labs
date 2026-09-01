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

    // Total Schools
    $stmt = $pdo->query('SELECT COUNT(*) as c FROM schools');
    $stats['total_schools'] = $stmt->fetch()['c'];

    // Capacity fill rate
    $stmt = $pdo->query('SELECT SUM(capacity) as cap, SUM(seats_taken) as taken FROM batches');
    $row = $stmt->fetch();
    $stats['fill_rate'] = $row['cap'] > 0 ? round(($row['taken'] / $row['cap']) * 100, 2) : 0;

    // Recent activity list
    $stmt = $pdo->query('
        SELECT p.full_name as participant, s.name as school, "Registration" as event,
               IF(p.entry_status = "PAID", "Paid", "Registered") as status,
               DATE_FORMAT(p.created_at, "%h:%i %p") as time
        FROM participants p 
        JOIN schools s ON p.school_id = s.id 
        ORDER BY p.created_at DESC 
        LIMIT 5
    ');
    $stats['recent_activity'] = $stmt->fetchAll() ?: [];

    sendResponse(true, 'Stats loaded.', $stats);
}
elseif ($action === 'list_workshops') {
    $stmt = $pdo->query('
        SELECT w.*, b.id as batch_id, b.capacity, b.seats_taken 
        FROM workshops w
        LEFT JOIN batches b ON w.id = b.workshop_id
        ORDER BY w.id DESC
    ');
    $workshops = $stmt->fetchAll() ?: [];
    sendResponse(true, 'Workshops loaded.', ['workshops' => $workshops]);
}
elseif ($action === 'save_workshop') {
    $id = $input['id'] ?? 0;
    $name = $input['name'] ?? '';
    $description = $input['description'] ?? '';
    $isPaid = $input['is_paid'] ? 1 : 0;
    $minGrade = (int)($input['min_grade'] ?? 4);
    $maxGrade = (int)($input['max_grade'] ?? 12);
    $capacity = (int)($input['capacity'] ?? 40);

    if (empty($name)) {
        sendResponse(false, 'Workshop name is required.');
    }

    try {
        $pdo->beginTransaction();
        if ($id) {
            $stmt = $pdo->prepare('UPDATE workshops SET name = ?, description = ?, is_paid = ?, min_grade = ?, max_grade = ? WHERE id = ?');
            $stmt->execute([$name, $description, $isPaid, $minGrade, $maxGrade, $id]);
            
            $stmt = $pdo->prepare('UPDATE batches SET capacity = ? WHERE workshop_id = ?');
            $stmt->execute([$capacity, $id]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO workshops (name, description, is_paid, min_grade, max_grade) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$name, $description, $isPaid, $minGrade, $maxGrade]);
            $newId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare('INSERT INTO batches (workshop_id, name, capacity, seats_taken) VALUES (?, "Batch 1", ?, 0)');
            $stmt->execute([$newId, $capacity]);
        }
        $pdo->commit();
        sendResponse(true, 'Workshop saved successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
elseif ($action === 'delete_workshop') {
    $id = (int)($input['id'] ?? 0);
    if (!$id) {
        sendResponse(false, 'Workshop ID is required.');
    }

    try {
        $pdo->beginTransaction();
        // Check if there are active bookings
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as c 
            FROM bookings bk
            JOIN batches bt ON bk.batch_id = bt.id
            WHERE bt.workshop_id = ? AND bk.status = "CONFIRMED"
        ');
        $stmt->execute([$id]);
        if ($stmt->fetch()['c'] > 0) {
            throw new Exception('Cannot delete workshop: active bookings exist.');
        }

        $stmt = $pdo->prepare('DELETE FROM workshops WHERE id = ?');
        $stmt->execute([$id]);
        $pdo->commit();
        sendResponse(true, 'Workshop deleted successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
