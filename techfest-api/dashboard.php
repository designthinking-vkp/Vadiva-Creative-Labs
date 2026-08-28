<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'get_dashboard') {
    $participantId = $_GET['participant_id'] ?? 0;
    
    if (!$participantId) {
        sendResponse(false, 'Participant ID is required.');
    }

    try {
        $stmt = $pdo->prepare('
            SELECT id, user_id, full_name, participant_id, grade, band, tier, entry_status 
            FROM participants WHERE id = ?
        ');
        $stmt->execute([$participantId]);
        $participant = $stmt->fetch();

        if (!$participant) {
            throw new Exception('Participant not found.');
        }

        // Determine pass colour based on bookings (mock logic for now since we don't have bookings yet)
        $passColour = 'GREEN'; // Default Explorer
        
        $dashboardData = [
            'profile' => [
                'name' => $participant['full_name'],
                'public_id' => $participant['participant_id'] ?: 'Pending Payment',
                'band' => $participant['band'],
                'tier' => $participant['tier'],
                'entry_status' => $participant['entry_status'],
                'pass_colour' => $passColour,
            ],
            'outstanding_actions' => [],
            'schedule' => [],
            'bookings' => [
                'paid_workshops' => [],
                'free_workshops' => [],
                'competitions' => []
            ]
        ];

        if ($participant['entry_status'] !== 'PAID') {
            $dashboardData['outstanding_actions'][] = [
                'type' => 'ENTRY_FEE',
                'message' => 'Pay the ₹250 festival entry fee to unlock workshops and competitions.'
            ];
            $dashboardData['is_locked'] = true;
        } else {
            $dashboardData['is_locked'] = false;
            
            // TODO: Fetch real schedule and bookings from the bookings and sessions table
            // For now, returning empty arrays as the foundation
            
            // Fetch bookings...
        }

        sendResponse(true, 'Dashboard loaded.', $dashboardData);
    } catch (Exception $e) {
        sendResponse(false, $e->getMessage());
    }
} else {
    sendResponse(false, 'Invalid action.');
}
?>
