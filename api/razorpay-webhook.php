<?php
/**
 * Vadiva Creative Labs - Razorpay Webhook Endpoint
 * Asynchronously captures and verifies payment events from Razorpay.
 */

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/event-config.php';

$webhookSecret = getenv('RAZORPAY_WEBHOOK_SECRET') ?: EVENT_RAZORPAY_KEY_SECRET;
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

if (empty($payload) || empty($signature)) {
    http_response_code(400);
    echo json_encode(array('status' => 'error', 'message' => 'Missing payload or signature'));
    exit;
}

$expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);
if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(400);
    echo json_encode(array('status' => 'error', 'message' => 'Invalid webhook signature'));
    exit;
}

$data = json_decode($payload, true);
$event = $data['event'] ?? '';

if ($event === 'payment.captured' || $event === 'order.paid') {
    $paymentEntity = $data['payload']['payment']['entity'] ?? array();
    $paymentId = $paymentEntity['id'] ?? '';
    $orderId = $paymentEntity['order_id'] ?? '';
    $notes = $paymentEntity['notes'] ?? array();
    $uid = $notes['participantUID'] ?? '';

    // Update local backup
    $backupFile = __DIR__ . '/event_registrations_backup.json';
    if (file_exists($backupFile)) {
        $backupList = json_decode(@file_get_contents($backupFile), true) ?: array();
        foreach ($backupList as $idx => $item) {
            if ((!empty($uid) && $item['participantUID'] === $uid) || (!empty($orderId) && ($item['razorpayOrderId'] ?? '') === $orderId)) {
                $backupList[$idx]['paymentStatus'] = 'Paid';
                $backupList[$idx]['registrationStatus'] = 'Confirmed';
                $backupList[$idx]['razorpayPaymentId'] = $paymentId;
                $backupList[$idx]['paidAt'] = date('Y-m-d H:i:s');
                break;
            }
        }
        @file_put_contents($backupFile, json_encode($backupList, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    // Sync to Google Sheet via GAS if URL configured
    if (EVENT_GAS_URL && strpos(EVENT_GAS_URL, 'AKfy') !== false) {
        $ch = curl_init(EVENT_GAS_URL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array(
            'action' => 'confirmPayment',
            'participantUID' => $uid,
            'razorpayOrderId' => $orderId,
            'razorpayPaymentId' => $paymentId,
            'eventName' => $notes['eventName'] ?? ''
        )));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        @curl_exec($ch);
        @curl_close($ch);
    }
}

http_response_code(200);
echo json_encode(array('status' => 'success'));
