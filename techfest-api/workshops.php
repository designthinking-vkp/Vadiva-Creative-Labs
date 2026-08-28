<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'list_workshops') {
    $type = $_GET['type'] ?? 'all'; // 'paid', 'free', 'all'
    
    try {
        $query = 'SELECT w.*, fb.price_velammal, fb.price_other FROM workshops w LEFT JOIN fee_bands fb ON w.fee_band_id = fb.id WHERE w.is_active = TRUE';
        if ($type === 'paid') {
            $query .= ' AND w.is_paid = TRUE';
        } elseif ($type === 'free') {
            $query .= ' AND w.is_paid = FALSE';
        }

        $stmt = $pdo->query($query);
        $workshops = $stmt->fetchAll();

        // Attach batches and sessions for each workshop
        foreach ($workshops as &$workshop) {
            $batchStmt = $pdo->prepare('SELECT id, name, capacity, seats_taken FROM batches WHERE workshop_id = ?');
            $batchStmt->execute([$workshop['id']]);
            $batches = $batchStmt->fetchAll();
            
            foreach ($batches as &$batch) {
                // Calculate remaining soft locks for this batch (locked_until > NOW())
                $softLockStmt = $pdo->prepare('SELECT COUNT(*) as locked_count FROM bookings WHERE batch_id = ? AND status = "SOFT_LOCK" AND locked_until > NOW()');
                $softLockStmt->execute([$batch['id']]);
                $locks = $softLockStmt->fetch();
                $lockedSeats = $locks['locked_count'] ?? 0;
                
                $batch['available_capacity'] = max(0, $batch['capacity'] - $batch['seats_taken'] - $lockedSeats);
                
                // Fetch sessions for this batch
                $sessionStmt = $pdo->prepare('SELECT s.id, s.starts_at, s.ends_at, v.name as venue_name FROM sessions s JOIN venues v ON s.venue_id = v.id WHERE s.batch_id = ? ORDER BY s.starts_at ASC');
                $sessionStmt->execute([$batch['id']]);
                $batch['sessions'] = $sessionStmt->fetchAll();
            }
            $workshop['batches'] = $batches;
        }

        sendResponse(true, 'Workshops loaded.', ['workshops' => $workshops]);
    } catch (Exception $e) {
        sendResponse(false, 'Failed to load workshops.');
    }
} else {
    sendResponse(false, 'Invalid action.');
}
?>
