<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$keyId = getenv('RAZORPAY_KEY_ID') ?: 'rzp_live_TJc8h2vN8fM4Nx';
$keySecret = getenv('RAZORPAY_KEY_SECRET') ?: 'Hwk3yDWs5Q6BBrSToRfaASd7';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$currency = isset($input['currency']) ? $input['currency'] : 'INR';
$amount = isset($input['amount']) ? (int)$input['amount'] : ($currency === 'USD' ? 2000 : 192000);
$receipt = isset($input['receipt']) ? $input['receipt'] : 'rcpt_' . time();

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array(
    'amount' => $amount,
    'currency' => $currency,
    'receipt' => $receipt
)));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo json_encode(array(
    'success' => $httpCode >= 200 && $httpCode < 300,
    'order' => json_decode($response, true),
    'key_id' => $keyId
));
