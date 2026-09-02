<?php
/**
 * TechFest Razorpay Payment Gateway API - Hostinger MySQL Integration
 * Vadiva Creative Labs - Tech & Design Fest '26
 *
 * Endpoints:
 * - action=create_order     : Creates a Razorpay payment order on backend
 * - action=verify_payment   : Cryptographically verifies signature and confirms registration in MySQL
 * - action=get_status       : Checks current payment/registration status (recovery after browser close)
 * - action=record_failure   : Logs failed or cancelled payment attempts
 * - action=webhook          : Razorpay Webhook listener with HMAC-SHA256 signature verification
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
$webhookSecret = defined('RAZORPAY_WEBHOOK_SECRET') ? RAZORPAY_WEBHOOK_SECRET : (getenv('RAZORPAY_WEBHOOK_SECRET') ?: 'vadiva_tf_webhook_secret_2026');

// Standard Workshop Catalog & Pricing Lookup
$WORKSHOP_CATALOG = [
    '1' => ['id' => 1, 'name' => 'Robotics & Automation', 'is_paid' => true, 'price_velammal' => 400, 'price_other' => 550, 'grades' => 'Grades 4–12', 'date' => 'Day 1 & Day 2 (Nov 2026)', 'time' => '10:00 AM - 01:00 PM', 'venue' => 'Robotics Lab, Hall A'],
    '2' => ['id' => 2, 'name' => 'AI & Machine Learning Basics', 'is_paid' => true, 'price_velammal' => 400, 'price_other' => 550, 'grades' => 'Grades 4–12', 'date' => 'Day 1 & Day 2 (Nov 2026)', 'time' => '02:00 PM - 05:00 PM', 'venue' => 'Computer Lab 1'],
    '3' => ['id' => 3, 'name' => '3D Printing & Design', 'is_paid' => true, 'price_velammal' => 350, 'price_other' => 500, 'grades' => 'Grades 4–12', 'date' => 'Day 2 (Nov 2026)', 'time' => '10:00 AM - 01:00 PM', 'venue' => 'Makerspace Studio'],
    '4' => ['id' => 4, 'name' => 'Game Development', 'is_paid' => true, 'price_velammal' => 400, 'price_other' => 550, 'grades' => 'Grades 4–12', 'date' => 'Day 2 & Day 3 (Nov 2026)', 'time' => '02:00 PM - 05:00 PM', 'venue' => 'Media & Coding Lab'],
    '5' => ['id' => 5, 'name' => 'Electronics & Circuits', 'is_paid' => true, 'price_velammal' => 300, 'price_other' => 450, 'grades' => 'Grades 4–12', 'date' => 'Day 1 (Nov 2026)', 'time' => '10:00 AM - 01:00 PM', 'venue' => 'Innovation Hub'],
    '6' => ['id' => 6, 'name' => 'Python for Beginners', 'is_paid' => true, 'price_velammal' => 350, 'price_other' => 500, 'grades' => 'Grades 4–12', 'date' => 'Day 3 (Nov 2026)', 'time' => '10:00 AM - 01:00 PM', 'venue' => 'Computer Lab 2'],
    '7' => ['id' => 7, 'name' => 'Design Thinking Bootcamp', 'is_paid' => false, 'price_velammal' => 250, 'price_other' => 250, 'grades' => 'Grades 4–12', 'date' => 'Day 1 (Nov 2026)', 'time' => '11:00 AM - 01:00 PM', 'venue' => 'Auditorium Hall'],
    '8' => ['id' => 8, 'name' => 'Sketching & Visual Thinking', 'is_paid' => false, 'price_velammal' => 250, 'price_other' => 250, 'grades' => 'Grades 4–12', 'date' => 'Day 2 (Nov 2026)', 'time' => '11:00 AM - 01:00 PM', 'venue' => 'Design Studio'],
    '9' => ['id' => 9, 'name' => 'Public Speaking & Pitching', 'is_paid' => false, 'price_velammal' => 250, 'price_other' => 250, 'grades' => 'Grades 4–12', 'date' => 'Day 2 (Nov 2026)', 'time' => '02:00 PM - 04:00 PM', 'venue' => 'Seminar Hall 1'],
    '10' => ['id' => 10, 'name' => 'Science Demonstrations', 'is_paid' => false, 'price_velammal' => 250, 'price_other' => 250, 'grades' => 'Grades 4–12', 'date' => 'Day 3 (Nov 2026)', 'time' => '10:00 AM - 12:00 PM', 'venue' => 'Main Stage'],
    '11' => ['id' => 11, 'name' => 'Student Entrepreneurship', 'is_paid' => false, 'price_velammal' => 250, 'price_other' => 250, 'grades' => 'Grades 4–12', 'date' => 'Day 3 (Nov 2026)', 'time' => '02:00 PM - 04:30 PM', 'venue' => 'Seminar Hall 2']
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
// 1. CREATE PAYMENT ORDER
// -----------------------------------------------------------------------------
if ($action === 'create_order' || $action === 'create_entry_payment') {
    $regId       = $input['registration_id'] ?? $input['participant_id'] ?? 0;
    $workshopId  = $input['workshop_id'] ?? '1';
    $payerUserId = $input['user_id'] ?? $input['payer_user_id'] ?? 0;
    $tier        = strtoupper($input['tier'] ?? 'OTHER');

    $workshop = $WORKSHOP_CATALOG[$workshopId] ?? null;
    if (!$workshop && $pdo) {
        $stmt = $pdo->prepare('SELECT * FROM workshops WHERE id = ?');
        $stmt->execute([$workshopId]);
        $wsRow = $stmt->fetch();
        if ($wsRow) {
            $workshop = [
                'id' => $wsRow['id'],
                'name' => $wsRow['title'],
                'is_paid' => $wsRow['is_paid'],
                'price_velammal' => $wsRow['price_velammal'],
                'price_other' => $wsRow['price'],
                'venue' => $wsRow['venue'],
                'date' => $wsRow['event_date'],
                'time' => $wsRow['start_time'] . ' - ' . $wsRow['end_time']
            ];
        }
    }

    if (!$workshop) {
        sendApiResponse(false, 'Invalid workshop selected.', [], 400);
    }

    $amountInRupees = ($tier === 'VELAMMAL') ? $workshop['price_velammal'] : $workshop['price_other'];
    if ($amountInRupees <= 0) {
        $amountInRupees = 250;
    }
    $amountInPaise = (int)round($amountInRupees * 100);

    $participantName = $input['name'] ?? 'Participant';
    $participantEmail = $input['email'] ?? 'reach@vadivacreativelabs.com';
    $participantMobile = $input['mobile'] ?? '9876543210';
    $regDbId = is_numeric($regId) ? (int)$regId : 0;
    $registrationNumber = '';

    // Check existing registration from MySQL
    try {
        if ($pdo && $regDbId > 0) {
            $stmt = $pdo->prepare('
                SELECT r.*, s.student_name, s.student_email, s.student_phone, s.school_name
                FROM registrations r
                JOIN students s ON r.student_id = s.id
                WHERE r.id = ? FOR UPDATE
            ');
            $stmt->execute([$regDbId]);
            $regRow = $stmt->fetch();

            if ($regRow) {
                $registrationNumber = $regRow['registration_number'];
                $participantName = $regRow['student_name'];
                $participantEmail = $regRow['student_email'] ?: $participantEmail;
                $participantMobile = $regRow['student_phone'] ?: $participantMobile;

                if (stripos($regRow['school_name'], 'velammal') !== false) {
                    $tier = 'VELAMMAL';
                }
                $amountInRupees = (float)$regRow['total_amount'];
                if ($amountInRupees <= 0) {
                    $amountInRupees = ($tier === 'VELAMMAL') ? $workshop['price_velammal'] : $workshop['price_other'];
                }
                $amountInPaise = (int)round($amountInRupees * 100);

                // Idempotency: Check if already confirmed
                if ($regRow['registration_status'] === 'confirmed') {
                    sendApiResponse(true, 'Registration is already confirmed and paid.', [
                        'is_already_paid' => true,
                        'registration_id' => $regRow['id'],
                        'registration_number' => $regRow['registration_number'],
                        'workshop_id' => $workshopId,
                        'workshop_name' => $workshop['name'],
                        'amount' => $amountInRupees,
                        'status' => 'confirmed'
                    ]);
                }
            }
        }
    } catch (Exception $e) {}

    $receiptId = 'TF_' . ($regDbId ?: time()) . '_' . rand(1000, 9999);

    // Call Razorpay API to create official order
    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'amount' => $amountInPaise,
        'currency' => 'INR',
        'receipt' => $receiptId,
        'notes' => [
            'registration_id' => (string)($regDbId ?: $regId),
            'registration_number' => (string)$registrationNumber,
            'workshop_id' => (string)$workshopId,
            'workshop_name' => $workshop['name'],
            'student_name' => $participantName
        ]
    ]));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300 || empty($response)) {
        $errObj = json_decode($response, true);
        $errMsg = $errObj['error']['description'] ?? $errObj['message'] ?? 'Failed to create payment order with gateway.';
        sendApiResponse(false, $errMsg, ['error_code' => 'GATEWAY_ORDER_CREATION_FAILED'], 502);
    }

    $rzpOrder = json_decode($response, true);
    $gatewayOrderId = $rzpOrder['id'];

    // Update payment record in MySQL
    try {
        if ($pdo && $regDbId > 0) {
            $stmt = $pdo->prepare('
                UPDATE payments 
                SET razorpay_order_id = ?, status = "pending", amount = ? 
                WHERE registration_id = ?
            ');
            $stmt->execute([$gatewayOrderId, $amountInRupees, $regDbId]);

            $stmt = $pdo->prepare('
                INSERT INTO payment_attempts (registration_id, razorpay_order_id, amount, currency, status)
                VALUES (?, ?, ?, "INR", "pending")
            ');
            $stmt->execute([$regDbId, $gatewayOrderId, $amountInRupees]);
        }
    } catch (Exception $dbErr) {}

    sendApiResponse(true, 'Payment order created successfully.', [
        'order_id' => $gatewayOrderId,
        'key_id' => $keyId,
        'amount' => $amountInPaise,
        'amount_in_rupees' => $amountInRupees,
        'currency' => 'INR',
        'receipt' => $receiptId,
        'registration_id' => $regDbId ?: $regId,
        'registration_number' => $registrationNumber,
        'workshop_id' => $workshopId,
        'workshop_name' => $workshop['name'],
        'workshop_date' => $workshop['date'],
        'workshop_time' => $workshop['time'],
        'workshop_venue' => $workshop['venue'],
        'prefill' => [
            'name' => $participantName,
            'email' => $participantEmail,
            'contact' => $participantMobile
        ]
    ]);
}

// -----------------------------------------------------------------------------
// 2. SERVER-SIDE PAYMENT SIGNATURE VERIFICATION
// -----------------------------------------------------------------------------
elseif ($action === 'verify_payment' || $action === 'verify_signature') {
    $orderId    = $input['razorpay_order_id'] ?? '';
    $paymentId  = $input['razorpay_payment_id'] ?? '';
    $signature  = $input['razorpay_signature'] ?? '';
    $regId      = $input['registration_id'] ?? $input['participant_id'] ?? '';
    $workshopId = $input['workshop_id'] ?? '1';

    if (empty($orderId) || empty($paymentId) || empty($signature)) {
        sendApiResponse(false, 'Missing required payment verification parameters.', ['error_code' => 'MISSING_PARAMETERS'], 400);
    }

    // Cryptographic HMAC SHA256 Verification
    $generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);

    if (!hash_equals($generatedSignature, $signature)) {
        // Log attempt as failed
        if ($pdo && is_numeric($regId) && (int)$regId > 0) {
            try {
                $pdo->prepare('UPDATE payments SET status = "failed", failure_reason = "Signature Mismatch" WHERE razorpay_order_id = ?')->execute([$orderId]);
                $pdo->prepare('UPDATE payment_attempts SET status = "failed", failure_reason = "Signature Mismatch" WHERE razorpay_order_id = ?')->execute([$orderId]);
                $pdo->prepare('UPDATE registrations SET registration_status = "payment_failed" WHERE id = ?')->execute([(int)$regId]);
            } catch (Exception $e) {}
        }
        sendApiResponse(false, 'Invalid payment signature. Verification failed.', ['error_code' => 'SIGNATURE_MISMATCH'], 400);
    }

    $workshop = $WORKSHOP_CATALOG[$workshopId] ?? $WORKSHOP_CATALOG['1'];
    $confirmedNumber = 'VF-2026-' . strtoupper(substr(md5($orderId . $paymentId), 0, 6));
    $participantName = $input['name'] ?? 'Participant';
    $settledAmount = (float)($input['amount'] ?? 550.00);

    // Update Hostinger MySQL records in transaction
    try {
        if ($pdo) {
            $pdo->beginTransaction();

            $regDbId = is_numeric($regId) ? (int)$regId : 0;

            // 1. Update Payment Record
            $stmt = $pdo->prepare('
                UPDATE payments 
                SET status = "paid", razorpay_payment_id = ?, razorpay_signature = ?, paid_at = NOW() 
                WHERE razorpay_order_id = ? OR registration_id = ?
            ');
            $stmt->execute([$paymentId, $signature, $orderId, $regDbId]);

            // 2. Update Payment Attempts
            $stmt = $pdo->prepare('
                UPDATE payment_attempts 
                SET status = "paid", razorpay_payment_id = ?, completed_at = NOW() 
                WHERE razorpay_order_id = ? OR registration_id = ?
            ');
            $stmt->execute([$paymentId, $orderId, $regDbId]);

            // 3. Confirm Registration
            if ($regDbId > 0) {
                $stmt = $pdo->prepare('
                    UPDATE registrations 
                    SET registration_status = "confirmed", confirmed_at = NOW() 
                    WHERE id = ?
                ');
                $stmt->execute([$regDbId]);

                // Fetch confirmed registration number & student name
                $stmt = $pdo->prepare('
                    SELECT r.registration_number, r.total_amount, s.student_name 
                    FROM registrations r 
                    JOIN students s ON r.student_id = s.id 
                    WHERE r.id = ?
                ');
                $stmt->execute([$regDbId]);
                $confirmedRow = $stmt->fetch();
                if ($confirmedRow) {
                    $confirmedNumber = $confirmedRow['registration_number'];
                    $participantName = $confirmedRow['student_name'];
                    $settledAmount = (float)$confirmedRow['total_amount'];
                }

                // 4. Increment registered_count on workshops
                $stmt = $pdo->prepare('
                    UPDATE workshops w
                    JOIN registration_workshops rw ON rw.workshop_id = w.id
                    SET w.registered_count = w.registered_count + 1
                    WHERE rw.registration_id = ?
                ');
                $stmt->execute([$regDbId]);
            }

            $pdo->commit();
        }
    } catch (Exception $dbVerifyErr) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }

    sendApiResponse(true, 'Payment verified and registration confirmed.', [
        'registration_id' => $regId ?: $confirmedNumber,
        'registration_number' => $confirmedNumber,
        'payment_id' => $paymentId,
        'order_id' => $orderId,
        'amount' => $settledAmount,
        'amount_formatted' => '₹' . number_format($settledAmount),
        'currency' => 'INR',
        'payment_status' => 'paid',
        'registration_status' => 'confirmed',
        'workshop_id' => $workshop['id'],
        'workshop_name' => $workshop['name'],
        'workshop_date' => $workshop['date'],
        'workshop_time' => $workshop['time'],
        'workshop_venue' => $workshop['venue'],
        'participant_name' => $participantName,
        'payment_date' => date('d M Y, h:i A')
    ]);
}

// -----------------------------------------------------------------------------
// 3. GET PAYMENT / REGISTRATION STATUS (Browser Recovery)
// -----------------------------------------------------------------------------
elseif ($action === 'get_status' || $action === 'status') {
    $regId = $input['registration_id'] ?? $_GET['registration_id'] ?? '';

    if (empty($regId)) {
        sendApiResponse(false, 'Registration ID is required to check status.', [], 400);
    }

    $statusData = [
        'registration_id' => $regId,
        'payment_status' => 'pending',
        'registration_status' => 'pending_payment',
        'is_paid' => false
    ];

    try {
        if ($pdo) {
            $stmt = $pdo->prepare('
                SELECT r.*, p.status as pay_status, p.razorpay_payment_id, p.paid_at
                FROM registrations r
                LEFT JOIN payments p ON p.registration_id = r.id
                WHERE r.id = ? OR r.registration_number = ?
                LIMIT 1
            ');
            $stmt->execute([is_numeric($regId) ? (int)$regId : 0, $regId]);
            $row = $stmt->fetch();

            if ($row) {
                $statusData['registration_number'] = $row['registration_number'];
                $statusData['registration_status'] = $row['registration_status'];
                $statusData['payment_status'] = $row['pay_status'] ?: 'pending';
                $statusData['is_paid'] = ($row['registration_status'] === 'confirmed' || $row['pay_status'] === 'paid');
                $statusData['payment_id'] = $row['razorpay_payment_id'];
                $statusData['paid_at'] = $row['paid_at'];
            }
        }
    } catch (Exception $e) {}

    sendApiResponse(true, 'Payment status fetched.', $statusData);
}

// -----------------------------------------------------------------------------
// 4. RECORD PAYMENT FAILURE
// -----------------------------------------------------------------------------
elseif ($action === 'record_failure') {
    $orderId = $input['order_id'] ?? '';
    $regId   = $input['registration_id'] ?? '';
    $reason  = $input['reason'] ?? 'Cancelled by user';

    try {
        if ($pdo) {
            $regDbId = is_numeric($regId) ? (int)$regId : 0;
            if ($regDbId > 0) {
                $stmt = $pdo->prepare('UPDATE registrations SET registration_status = "payment_failed" WHERE id = ? AND registration_status != "confirmed"');
                $stmt->execute([$regDbId]);
            }
            if (!empty($orderId)) {
                $stmt = $pdo->prepare('UPDATE payments SET status = "failed", failure_reason = ? WHERE razorpay_order_id = ? AND status != "paid"');
                $stmt->execute([$reason, $orderId]);

                $stmt = $pdo->prepare('UPDATE payment_attempts SET status = "failed", failure_reason = ? WHERE razorpay_order_id = ? AND status != "paid"');
                $stmt->execute([$reason, $orderId]);
            }
        }
    } catch (Exception $failErr) {}

    sendApiResponse(true, 'Failure recorded.', ['order_id' => $orderId, 'reason' => $reason]);
}

// -----------------------------------------------------------------------------
// 5. RAZORPAY WEBHOOK (Asynchronous confirmation)
// -----------------------------------------------------------------------------
elseif ($action === 'webhook') {
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

    if (!empty($webhookSecret) && $webhookSecret !== 'your_webhook_secret') {
        $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);
        if (!hash_equals($expectedSignature, $signature)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid webhook signature']);
            exit;
        }
    }

    $event = json_decode($payload, true);
    if (!$event || !isset($event['event'])) {
        http_response_code(400);
        exit('Invalid JSON payload');
    }

    $eventType = $event['event'];

    if ($eventType === 'order.paid' || $eventType === 'payment.captured') {
        $gatewayOrderId = $event['payload']['payment']['entity']['order_id'] ?? '';
        $gatewayPaymentId = $event['payload']['payment']['entity']['id'] ?? '';

        if (!empty($gatewayOrderId) && isset($pdo)) {
            try {
                $pdo->beginTransaction();

                $stmt = $pdo->prepare('SELECT id, registration_id, status FROM payments WHERE razorpay_order_id = ? FOR UPDATE');
                $stmt->execute([$gatewayOrderId]);
                $payment = $stmt->fetch();

                if ($payment && $payment['status'] !== 'paid') {
                    $pdo->prepare('UPDATE payments SET status = "paid", razorpay_payment_id = ?, paid_at = NOW() WHERE id = ?')
                        ->execute([$gatewayPaymentId, $payment['id']]);

                    if ($payment['registration_id']) {
                        $pdo->prepare('UPDATE registrations SET registration_status = "confirmed", confirmed_at = NOW() WHERE id = ?')
                            ->execute([$payment['registration_id']]);

                        $pdo->prepare('
                            UPDATE workshops w
                            JOIN registration_workshops rw ON rw.workshop_id = w.id
                            SET w.registered_count = w.registered_count + 1
                            WHERE rw.registration_id = ?
                        ')->execute([$payment['registration_id']]);
                    }
                }

                $pdo->commit();
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            }
        }
    }

    http_response_code(200);
    echo json_encode(['status' => 'ok']);
    exit;
}

// -----------------------------------------------------------------------------
// INVALID ACTION
// -----------------------------------------------------------------------------
else {
    sendApiResponse(false, 'Invalid action.', [], 404);
}
?>
