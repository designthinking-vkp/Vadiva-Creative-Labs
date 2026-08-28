<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

$keyId = getenv('RAZORPAY_KEY_ID') ?: 'rzp_live_TJc8h2vN8fM4Nx';
$keySecret = getenv('RAZORPAY_KEY_SECRET') ?: 'Hwk3yDWs5Q6BBrSToRfaASd7';
$webhookSecret = getenv('RAZORPAY_WEBHOOK_SECRET') ?: 'your_webhook_secret';

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'create_entry_payment') {
    $participantId = $input['participant_id'] ?? 0;
    $payerUserId = $input['payer_user_id'] ?? 0;

    if (!$participantId || !$payerUserId) {
        sendResponse(false, 'Participant ID and Payer User ID are required.');
    }

    $amount = 250; // Entry fee is exactly ₹250

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT entry_status FROM participants WHERE id = ? FOR UPDATE');
        $stmt->execute([$participantId]);
        $participant = $stmt->fetch();

        if (!$participant) {
            throw new Exception('Participant not found.');
        }
        if ($participant['entry_status'] === 'PAID') {
            throw new Exception('Entry fee is already paid for this participant.');
        }

        $orderRef = 'TF_ORD_' . time() . '_' . rand(1000, 9999);

        // 1. Call Razorpay to create order
        $ch = curl_init('https://api.razorpay.com/v1/orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'amount' => $amount * 100, // in paise
            'currency' => 'INR',
            'receipt' => $orderRef
        ]));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new Exception('Failed to create payment order with gateway.');
        }

        $rzpOrder = json_decode($response, true);
        $gatewayRef = $rzpOrder['id'];

        // 2. Save payment to database
        $stmt = $pdo->prepare('
            INSERT INTO payments (order_ref, gateway_ref, payer_user_id, amount, currency, state) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$orderRef, $gatewayRef, $payerUserId, $amount, 'INR', 'CREATED']);
        $paymentId = $pdo->lastInsertId();

        $stmt = $pdo->prepare('
            INSERT INTO payment_items (payment_id, item_type, item_id, unit_price, quantity, line_total) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$paymentId, 'ENTRY_FEE', $participantId, $amount, 1, $amount]);

        $pdo->commit();
        sendResponse(true, 'Payment order created.', [
            'order_id' => $gatewayRef, 
            'key_id' => $keyId,
            'amount' => $amount * 100
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
elseif ($action === 'webhook') {
    // Razorpay Webhook Endpoint
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

    $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);
    
    // Uncomment for actual signature validation in production:
    // if (!hash_equals($expectedSignature, $signature)) {
    //    http_response_code(400);
    //    exit('Invalid signature');
    // }

    $event = json_decode($payload, true);
    if (!$event) {
        http_response_code(400);
        exit('Invalid JSON');
    }

    $eventId = $event['event'] ?? '';
    
    if ($eventId === 'order.paid' || $eventId === 'payment.captured') {
        $gatewayRef = $event['payload']['payment']['entity']['order_id'] ?? '';
        $paymentIdEvent = $event['payload']['payment']['entity']['id'] ?? '';

        if (!$gatewayRef) {
            http_response_code(200);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('SELECT id, state FROM payments WHERE gateway_ref = ? FOR UPDATE');
            $stmt->execute([$gatewayRef]);
            $payment = $stmt->fetch();

            if ($payment && $payment['state'] !== 'SUCCESS') {
                // Idempotency: Make sure we don't process it twice
                
                // Update payment state
                $pdo->prepare('UPDATE payments SET state = "SUCCESS", settled_at = NOW() WHERE id = ?')
                    ->execute([$payment['id']]);

                // Log event
                $pdo->prepare('INSERT INTO payment_events (payment_id, gateway_event_id, event_type, payload) VALUES (?, ?, ?, ?)')
                    ->execute([$payment['id'], $event['account_id'].'_'.$paymentIdEvent, $eventId, json_encode($event)]);

                // Check payment items for entry fee
                $stmt = $pdo->prepare('SELECT item_type, item_id FROM payment_items WHERE payment_id = ?');
                $stmt->execute([$payment['id']]);
                $items = $stmt->fetchAll();

                foreach ($items as $item) {
                    if ($item['item_type'] === 'ENTRY_FEE') {
                        $participantId = $item['item_id'];
                        
                        // Generate participant ID and QR token
                        $publicId = 'TF26-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 6));
                        $qrToken = bin2hex(random_bytes(32));

                        $stmt = $pdo->prepare('
                            UPDATE participants 
                            SET entry_status = "PAID", participant_id = ?, qr_token = ? 
                            WHERE id = ?
                        ');
                        $stmt->execute([$publicId, $qrToken, $participantId]);
                        
                        // Add QR token to qr_tokens table
                        $stmt = $pdo->prepare('INSERT INTO qr_tokens (participant_id, token) VALUES (?, ?)');
                        $stmt->execute([$participantId, $qrToken]);
                        
                        // Notifications (mocked)
                        // TODO: Trigger Email and SMS notification queues
                    }
                }
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            exit;
        }
    }

    http_response_code(200);
    echo json_encode(['status' => 'ok']);
    exit;
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
