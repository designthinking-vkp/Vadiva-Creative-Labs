<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'join_waitlist') {
    $participantId = $input['participant_id'] ?? 0;
    $batchId = $input['batch_id'] ?? 0;

    if (!$participantId || !$batchId) {
        sendResponse(false, 'Participant ID and Batch ID are required.');
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('SELECT COUNT(*) as c FROM waitlists WHERE participant_id = ? AND batch_id = ?');
        $stmt->execute([$participantId, $batchId]);
        if ($stmt->fetch()['c'] > 0) {
            throw new Exception('You are already on the waitlist for this batch.');
        }

        $stmt = $pdo->prepare('SELECT MAX(position) as max_pos FROM waitlists WHERE batch_id = ?');
        $stmt->execute([$batchId]);
        $maxPos = $stmt->fetch()['max_pos'] ?? 0;

        $stmt = $pdo->prepare('INSERT INTO waitlists (participant_id, batch_id, position) VALUES (?, ?, ?)');
        $stmt->execute([$participantId, $batchId, $maxPos + 1]);

        $pdo->commit();
        sendResponse(true, 'Successfully joined the waitlist. We will notify you if a seat opens.');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
elseif ($action === 'accept_offer') {
    // Logic for accepting a waitlist offer
    $waitlistId = $input['waitlist_id'] ?? 0;

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT * FROM waitlists WHERE id = ? FOR UPDATE');
        $stmt->execute([$waitlistId]);
        $waitlist = $stmt->fetch();

        if (!$waitlist || $waitlist['state'] !== 'OFFERED') {
            throw new Exception('Invalid or expired offer.');
        }

        if (strtotime($waitlist['offer_expires_at']) < time()) {
            $pdo->prepare('UPDATE waitlists SET state = "EXPIRED" WHERE id = ?')->execute([$waitlistId]);
            throw new Exception('This offer has expired.');
        }

        // Convert to SOFT_LOCK for checkout
        $stmt = $pdo->prepare('UPDATE waitlists SET state = "ACCEPTED" WHERE id = ?');
        $stmt->execute([$waitlistId]);

        $stmt = $pdo->prepare('INSERT INTO bookings (participant_id, batch_id, status, locked_until) VALUES (?, ?, "SOFT_LOCK", DATE_ADD(NOW(), INTERVAL 15 MINUTE))');
        $stmt->execute([$waitlist['participant_id'], $waitlist['batch_id']]);

        $pdo->commit();
        sendResponse(true, 'Offer accepted. You have 15 minutes to complete payment.');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
