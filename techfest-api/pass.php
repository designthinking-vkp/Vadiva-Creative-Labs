<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'get_pass') {
    $participantId = $_GET['participant_id'] ?? 0;

    if (!$participantId) {
        sendResponse(false, 'Participant ID required.');
    }

    try {
        $stmt = $pdo->prepare('
            SELECT p.full_name, p.participant_id, p.band, p.tier, s.name as school_name, q.token
            FROM participants p
            JOIN schools s ON p.school_id = s.id
            LEFT JOIN qr_tokens q ON p.id = q.participant_id AND q.is_active = TRUE
            WHERE p.id = ? AND p.entry_status = "PAID"
        ');
        $stmt->execute([$participantId]);
        $participant = $stmt->fetch();

        if (!$participant) {
            throw new Exception('Pass unavailable. Ensure entry fee is paid.');
        }

        // Calculate pass colour
        // Priority: Innovator > Competitor > Maker > Explorer
        $passColour = 'GREEN'; // Default Explorer
        $passText = 'Explorer';
        
        $stmt = $pdo->prepare('
            SELECT w.name as workshop_name, w.is_paid, cw.id as comp_window_id
            FROM bookings b
            JOIN batches ba ON b.batch_id = ba.id
            JOIN workshops w ON ba.workshop_id = w.id
            LEFT JOIN competition_entries ce ON b.participant_id = ce.participant_id
            LEFT JOIN competition_windows cw ON ce.competition_window_id = cw.id
            WHERE b.participant_id = ? AND b.status = "CONFIRMED"
        ');
        $stmt->execute([$participantId]);
        $bookings = $stmt->fetchAll();

        $hasPaidWorkshop = false;
        $hasCompetition = false;

        foreach ($bookings as $b) {
            if ($b['is_paid']) $hasPaidWorkshop = true;
            if ($b['comp_window_id']) $hasCompetition = true;
        }

        if ($hasPaidWorkshop && $hasCompetition) {
            $passColour = 'GOLD';
            $passText = 'Innovator';
        } elseif ($hasCompetition) {
            $passColour = 'RED';
            $passText = 'Competitor';
        } elseif ($hasPaidWorkshop) {
            $passColour = 'BLUE';
            $passText = 'Maker';
        }

        sendResponse(true, 'Pass fetched.', [
            'name' => $participant['full_name'],
            'public_id' => $participant['participant_id'],
            'school' => $participant['school_name'],
            'band' => $participant['band'],
            'colour' => $passColour,
            'colour_text' => $passText,
            'qr_token' => $participant['token']
        ]);
    } catch (Exception $e) {
        sendResponse(false, $e->getMessage());
    }
} else {
    sendResponse(false, 'Invalid action.');
}
?>
