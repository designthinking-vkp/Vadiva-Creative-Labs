<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$keySecret = getenv('RAZORPAY_KEY_SECRET') ?: 'Hwk3yDWs5Q6BBrSToRfaASd7';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$orderId = isset($input['razorpay_order_id']) ? $input['razorpay_order_id'] : '';
$paymentId = isset($input['razorpay_payment_id']) ? $input['razorpay_payment_id'] : '';
$signature = isset($input['razorpay_signature']) ? $input['razorpay_signature'] : '';

if (!$orderId || !$paymentId || !$signature) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Missing parameters'));
    exit;
}

$generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);

if (hash_equals($generatedSignature, $signature)) {
    echo json_encode(array(
        'success' => true,
        'message' => 'Signature verified successfully',
        'payment_id' => $paymentId,
        'order_id' => $orderId
    ));
} else {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Invalid payment signature'));
}
