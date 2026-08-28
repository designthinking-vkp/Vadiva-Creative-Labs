<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'submit_consent') {
    $participantId = $input['participant_id'] ?? 0;
    
    // We expect a dictionary of consents: e.g. ["GUARDIAN" => true, "MEDIA" => false, "LAPTOP" => true, "NON_REFUNDABLE" => true]
    $consents = $input['consents'] ?? [];

    if (!$participantId) {
        sendResponse(false, 'Participant ID is required.');
    }

    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('
            INSERT INTO consents (participant_id, consent_type, is_given, ip_address) 
            VALUES (?, ?, ?, ?)
        ');

        foreach (['GUARDIAN', 'MEDIA', 'LAPTOP', 'NON_REFUNDABLE'] as $type) {
            $isGiven = isset($consents[$type]) ? (bool)$consents[$type] : false;
            
            // Validation rules
            if ($type === 'GUARDIAN' && !$isGiven) {
                throw new Exception('Guardian consent is strictly required.');
            }
            if ($type === 'NON_REFUNDABLE' && !$isGiven) {
                throw new Exception('Non-refundable acknowledgement is strictly required.');
            }
            // Media consent is optional, so it defaults to false and is allowed to be false.

            $stmt->execute([$participantId, $type, $isGiven ? 1 : 0, $ipAddress]);
        }

        $pdo->commit();
        sendResponse(true, 'Consents recorded successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
} else {
    sendResponse(false, 'Invalid action.');
}
?>
