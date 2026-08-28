<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'book_free_workshop') {
    $participantId = $input['participant_id'] ?? 0;
    $batchId = $input['batch_id'] ?? 0;

    if (!$participantId || !$batchId) {
        sendResponse(false, 'Participant ID and Batch ID are required.');
    }

    try {
        $pdo->beginTransaction();

        // Check if participant paid entry fee
        $stmt = $pdo->prepare('SELECT entry_status, full_name, grade FROM participants WHERE id = ?');
        $stmt->execute([$participantId]);
        $participant = $stmt->fetch();
        if (!$participant || $participant['entry_status'] !== 'PAID') {
            throw new Exception('Pay the ₹250 festival entry fee to unlock workshops and competitions.');
        }

        // Get workshop and session details
        $stmt = $pdo->prepare('
            SELECT b.workshop_id, w.name as topic, w.min_grade, w.max_grade, 
                   s.starts_at, DATE(s.starts_at) as session_date 
            FROM batches b 
            JOIN workshops w ON b.workshop_id = w.id 
            JOIN sessions s ON s.batch_id = b.id 
            WHERE b.id = ? AND w.is_paid = FALSE
        ');
        $stmt->execute([$batchId]);
        $workshop = $stmt->fetch();

        if (!$workshop) {
            throw new Exception('Invalid free workshop batch.');
        }

        // Validate Grade
        if ($participant['grade'] < $workshop['min_grade'] || $participant['grade'] > $workshop['max_grade']) {
            throw new Exception('This workshop is for Grades ' . $workshop['min_grade'] . '–' . $workshop['max_grade'] . '. ' . $participant['full_name'] . ' is in Grade ' . $participant['grade'] . '.');
        }

        // Fetch existing bookings for this participant
        $stmt = $pdo->prepare('
            SELECT b.batch_id, w.id as workshop_id, w.name as topic, s.starts_at, DATE(s.starts_at) as session_date
            FROM bookings b
            JOIN batches ba ON b.batch_id = ba.id
            JOIN workshops w ON ba.workshop_id = w.id
            JOIN sessions s ON s.batch_id = ba.id
            WHERE b.participant_id = ? AND w.is_paid = FALSE AND b.status IN ("CONFIRMED", "SOFT_LOCK")
        ');
        $stmt->execute([$participantId]);
        $existingBookings = $stmt->fetchAll();

        $totalCount = count($existingBookings);
        $dailyCount = 0;

        if ($totalCount >= 4) {
            throw new Exception('You can book four free sessions across the festival. You have four.');
        }

        foreach ($existingBookings as $booking) {
            if ($booking['workshop_id'] == $workshop['workshop_id']) {
                throw new Exception('You have already booked ' . $workshop['topic'] . '. Each topic can be booked once.');
            }
            if ($booking['session_date'] === $workshop['session_date']) {
                $dailyCount++;
            }
        }

        if ($dailyCount >= 2) {
            throw new Exception('You can book two free sessions per day. You already have two on ' . $workshop['session_date'] . '.');
        }

        // Check Capacity
        $stmt = $pdo->prepare('
            SELECT capacity, seats_taken, 
                   (SELECT COUNT(*) FROM bookings WHERE batch_id = b.id AND status = "SOFT_LOCK" AND locked_until > NOW()) as locked_seats
            FROM batches b WHERE id = ? FOR UPDATE
        ');
        $stmt->execute([$batchId]);
        $batch = $stmt->fetch();

        $available = $batch['capacity'] - $batch['seats_taken'] - $batch['locked_seats'];
        if ($available <= 0) {
            throw new Exception('This batch is full. Join the waitlist and we will notify you if a seat opens.');
        }

        // Create booking immediately (no payment required)
        $stmt = $pdo->prepare('INSERT INTO bookings (participant_id, batch_id, status) VALUES (?, ?, "CONFIRMED")');
        $stmt->execute([$participantId, $batchId]);

        // Increment seats_taken
        $stmt = $pdo->prepare('UPDATE batches SET seats_taken = seats_taken + 1 WHERE id = ?');
        $stmt->execute([$batchId]);

        $pdo->commit();
        sendResponse(true, 'Free workshop booked successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
} else {
    sendResponse(false, 'Invalid action.');
}
?>
