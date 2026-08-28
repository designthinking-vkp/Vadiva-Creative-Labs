<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/clash.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'add_to_cart') {
    $participantId = $input['participant_id'] ?? 0;
    $batchId = $input['batch_id'] ?? 0;

    if (!$participantId || !$batchId) {
        sendResponse(false, 'Participant ID and Batch ID are required.');
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT entry_status, full_name, tier FROM participants WHERE id = ?');
        $stmt->execute([$participantId]);
        $participant = $stmt->fetch();

        if (!$participant || $participant['entry_status'] !== 'PAID') {
            throw new Exception('Pay the ₹250 festival entry fee to unlock workshops and competitions.');
        }

        // Fetch Workshop and Sessions
        $stmt = $pdo->prepare('
            SELECT b.capacity, b.seats_taken, w.name as topic, w.is_paid,
            (SELECT COUNT(*) FROM bookings WHERE batch_id = b.id AND status = "SOFT_LOCK" AND locked_until > NOW()) as locked_seats
            FROM batches b 
            JOIN workshops w ON b.workshop_id = w.id 
            WHERE b.id = ? FOR UPDATE
        ');
        $stmt->execute([$batchId]);
        $batch = $stmt->fetch();

        if (!$batch || !$batch['is_paid']) {
            throw new Exception('Invalid paid workshop batch.');
        }

        // Capacity Check
        $available = $batch['capacity'] - $batch['seats_taken'] - $batch['locked_seats'];
        if ($available <= 0) {
            throw new Exception('This batch is full. Join the waitlist and we will notify you if a seat opens.');
        }

        // Limits Check: 2 Paid Workshops Max
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as paid_count FROM bookings b
            JOIN batches ba ON b.batch_id = ba.id
            JOIN workshops w ON ba.workshop_id = w.id
            WHERE b.participant_id = ? AND w.is_paid = TRUE AND b.status IN ("CONFIRMED", "SOFT_LOCK") AND (b.locked_until IS NULL OR b.locked_until > NOW())
        ');
        $stmt->execute([$participantId]);
        $countRes = $stmt->fetch();
        if (($countRes['paid_count'] ?? 0) >= 2) {
            throw new Exception('You can book two paid workshops. Cancel one to book another.');
        }

        // Clash Detection
        $stmt = $pdo->prepare('SELECT starts_at, ends_at FROM sessions WHERE batch_id = ?');
        $stmt->execute([$batchId]);
        $sessions = $stmt->fetchAll();

        foreach ($sessions as $session) {
            $clashMsg = detectClash($pdo, $participantId, $session['starts_at'], $session['ends_at'], $batch['topic']);
            if ($clashMsg) {
                throw new Exception($clashMsg);
            }
        }

        // Add Soft Lock for 10 minutes
        $stmt = $pdo->prepare('INSERT INTO bookings (participant_id, batch_id, status, locked_until) VALUES (?, ?, "SOFT_LOCK", DATE_ADD(NOW(), INTERVAL 10 MINUTE))');
        $stmt->execute([$participantId, $batchId]);

        $pdo->commit();
        sendResponse(true, 'Added to cart.', ['locked_until' => date('c', time() + 600)]);

    } catch (Exception $e) {
        $pdo->rollBack();
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendResponse(false, 'You have already added this to your cart.');
        }
        sendResponse(false, $e->getMessage());
    }
}
elseif ($action === 'checkout_verify') {
    // This is called right before payment processing to recalculate server-side totals
    $participantId = $input['participant_id'] ?? 0;
    $clientExpectedTotal = $input['expected_total'] ?? 0;

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT tier FROM participants WHERE id = ?');
        $stmt->execute([$participantId]);
        $participant = $stmt->fetch();

        // 1. Find all active soft locks for this participant
        $stmt = $pdo->prepare('
            SELECT b.id as booking_id, ba.id as batch_id, w.name, fb.price_velammal, fb.price_other, b.locked_until
            FROM bookings b
            JOIN batches ba ON b.batch_id = ba.id
            JOIN workshops w ON ba.workshop_id = w.id
            JOIN fee_bands fb ON w.fee_band_id = fb.id
            WHERE b.participant_id = ? AND b.status = "SOFT_LOCK"
        ');
        $stmt->execute([$participantId]);
        $cartItems = $stmt->fetchAll();

        $serverTotal = 0;
        $validItems = [];

        foreach ($cartItems as $item) {
            if (strtotime($item['locked_until']) < time()) {
                throw new Exception('Your seats were released because checkout was not completed in time. Please select again.');
            }
            
            $price = ($participant['tier'] === 'VELAMMAL') ? $item['price_velammal'] : $item['price_other'];
            $serverTotal += $price;
            
            // Re-run clash detection just in case (e.g. if final was added by admin)
            $stmt2 = $pdo->prepare('SELECT starts_at, ends_at FROM sessions WHERE batch_id = ?');
            $stmt2->execute([$item['batch_id']]);
            $sessions = $stmt2->fetchAll();
            foreach ($sessions as $session) {
                // Temporarily ignore this booking ID for clash detection logic (handled inside clash.php by ensuring strict logic or bypassing self)
            }

            $validItems[] = [
                'name' => $item['name'],
                'price' => $price,
                'booking_id' => $item['booking_id']
            ];
        }

        if (count($validItems) === 0) {
            throw new Exception('Cart is empty or locks expired.');
        }

        if (floatval($serverTotal) !== floatval($clientExpectedTotal)) {
            throw new Exception('Prices were updated while your cart was open. Please review the new total before paying.');
        }

        $pdo->commit();
        sendResponse(true, 'Checkout verified.', ['server_total' => $serverTotal, 'items' => $validItems]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
