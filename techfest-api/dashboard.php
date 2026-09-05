<?php
/**
 * Vadiva Tech Fest 3.0 — Dashboard & "My Schedule" API (Single Source of Truth)
 * Vadiva Creative Labs
 *
 * Endpoints:
 * - GET ?action=get_dashboard&participant_id=... : Returns participant profile, pass info, and compiled 3-day timeline
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/env.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';
$participantId = $_GET['participant_id'] ?? ($_GET['user_id'] ?? 0);

function sendResponse($success, $message, $data = [], $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Master Workshop Reference for Schedule enrichment
$MASTER_WS = [
    '1' => ['name' => 'Rocket Lab', 'venue' => 'Outdoor Launch Pad', 'what_to_bring' => 'Safety goggles (provided)'],
    '2' => ['name' => 'Satellite Makers', 'venue' => 'Space Sciences Lab', 'what_to_bring' => 'Laptop / Tablet (optional)'],
    '3' => ['name' => 'Drone Pilot Academy', 'venue' => 'Safety Flight Cage', 'what_to_bring' => 'Comfortable shoes'],
    '4' => ['name' => 'Aeroforge', 'venue' => 'Air Arena', 'what_to_bring' => 'Notebook & pen'],
    '5' => ['name' => 'AR/VR Experience Lab', 'venue' => 'Immersive Media Lab', 'what_to_bring' => 'Smartphone (optional)'],
    '6' => ['name' => 'AI Inventors Lab', 'venue' => 'Edge AI Computing Center', 'what_to_bring' => 'Laptop required'],
    '7' => ['name' => 'Game Forge', 'venue' => 'Coding & Game Studio', 'what_to_bring' => 'Laptop recommended'],
    '8' => ['name' => '3D Makers Lab', 'venue' => 'Digital Fabrication Studio', 'what_to_bring' => 'Pen drive (optional)'],
    '9' => ['name' => 'Arduino Inventors Lab', 'venue' => 'Hardware Innovation Lab', 'what_to_bring' => 'None (Kits provided)'],
    '10' => ['name' => 'Animation Lab', 'venue' => 'Creative Design Studio', 'what_to_bring' => 'Sketchpad & pencils'],
    '11' => ['name' => 'Design Thinking Bootcamp', 'venue' => 'Theatre Alpha (Arena A)', 'what_to_bring' => 'None'],
    '12' => ['name' => 'Sketching & Visual Thinking', 'venue' => 'Theatre Beta (Hall B)', 'what_to_bring' => 'Drawing pencils'],
    '13' => ['name' => 'Public Speaking & Pitching', 'venue' => 'Theatre Alpha (Arena A)', 'what_to_bring' => 'Notepad'],
    '14' => ['name' => 'Science Demonstrations', 'venue' => 'Main Stage Theatre', 'what_to_bring' => 'None'],
    '15' => ['name' => 'Student Entrepreneurship', 'venue' => 'Theatre Beta (Hall B)', 'what_to_bring' => 'Idea notes']
];

if ($action === 'get_dashboard' || empty($action)) {
    if (!$participantId) {
        sendResponse(false, 'Participant ID is required.', [], 400);
    }

    $participant = null;
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $stmt = $pdo->prepare("
                SELECT p.*, u.email as user_email, u.phone as user_phone 
                FROM participants p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id = ? OR p.user_id = ? OR p.participant_id = ?
                LIMIT 1
            ");
            $stmt->execute([$participantId, $participantId, (string)$participantId]);
            $participant = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
    }

    // Clean fallback if participant not in DB yet
    if (!$participant) {
        $pNum = is_numeric($participantId) ? (int)$participantId : 1001;
        $participant = [
            'id' => $pNum,
            'user_id' => $pNum,
            'participant_id' => sprintf('TF-2026-%04d', $pNum),
            'full_name' => 'Registered Participant',
            'grade' => 6,
            'section' => 'A',
            'school' => 'Other School',
            'band' => 'JUNIOR',
            'entry_status' => 'PAID',
            'qr_token' => 'QR-TF-' . strtoupper(substr(md5((string)$pNum), 0, 16))
        ];
    }

    $isEntryPaid = ($participant['entry_status'] === 'PAID');
    $band = $participant['band'] ?: 'JUNIOR';
    $publicPid = $participant['participant_id'] ?: sprintf('TF-2026-%04d', $participant['id']);

    // Pass colour default is Explorer (Green)
    $passColour = 'GREEN';
    $passColourText = 'Explorer';
    $passColourHex = '#10b981';

    $dashboardData = [
        'profile' => [
            'id' => (int)$participant['id'],
            'user_id' => (int)$participant['user_id'],
            'name' => $participant['full_name'],
            'participant_id' => $publicPid,
            'grade' => (int)$participant['grade'],
            'section' => $participant['section'] ?? '',
            'school' => $participant['school'] ?? 'Other School',
            'band' => $band,
            'entry_status' => $participant['entry_status'],
            'is_entry_paid' => $isEntryPaid,
            'pass_colour' => $passColour,
            'pass_colour_text' => $passColourText,
            'pass_colour_hex' => $passColourHex,
            'qr_token' => $participant['qr_token'] ?? ('QR-TF-' . $publicPid)
        ],
        'is_locked' => !$isEntryPaid,
        'outstanding_actions' => [],
        'my_schedule' => [
            'day_1' => [],
            'day_2' => [],
            'day_3' => []
        ],
        'bookings' => [
            'paid_workshops' => [],
            'free_workshops' => [],
            'competitions' => []
        ]
    ];

    if (!$isEntryPaid) {
        $dashboardData['outstanding_actions'][] = [
            'type' => 'ENTRY_FEE',
            'amount' => 250,
            'title' => 'Mandatory ₹250 Festival Entry Pass',
            'message' => 'Pay the ₹250 festival entry fee to unlock workshops, competitions, and your participant pass.'
        ];
    } else {
        // Query Database for confirmed bookings
        $dbBookings = [];
        if (isset($pdo) && $pdo instanceof PDO) {
            try {
                $bStmt = $pdo->prepare("
                    SELECT wb.*, w.name as workshop_name, w.min_grade, w.max_grade 
                    FROM workshop_bookings wb
                    LEFT JOIN workshops w ON wb.workshop_id = w.id
                    WHERE wb.participant_id = ? AND wb.status = 'CONFIRMED'
                    ORDER BY wb.created_at ASC
                ");
                $bStmt->execute([$participant['id']]);
                $dbBookings = $bStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $be) {}
        }

        // Compile unified schedule
        $scheduleDay1 = [];
        $scheduleDay2 = [];
        $scheduleDay3 = [];

        // Festival Opening & Marshalling
        $scheduleDay1[] = [
            'type' => 'FESTIVAL_EVENT',
            'time' => '08:30 – 09:15',
            'title' => 'Festival Opening & Badge Check-in',
            'venue' => 'Main Registration Atrium',
            'what_to_bring' => 'QR Code Pass / ID Card'
        ];

        foreach ($dbBookings as $bk) {
            $wsId = (string)$bk['workshop_id'];
            $wsInfo = $MASTER_WS[$wsId] ?? ['name' => $bk['workshop_name'] ?: 'Tech Masterclass', 'venue' => 'Innovation Lab', 'what_to_bring' => 'Standard kit'];

            if ($bk['workshop_type'] === 'PAID') {
                $dashboardData['bookings']['paid_workshops'][] = [
                    'booking_reference' => $bk['booking_reference'],
                    'workshop_id' => $wsId,
                    'name' => $wsInfo['name'],
                    'status' => 'CONFIRMED',
                    'sessions' => 'Day 1 & Day 2 (09:30–11:30)'
                ];

                // Add Day 1 Session
                $scheduleDay1[] = [
                    'type' => 'PAID_WORKSHOP',
                    'time' => '09:30 – 11:30',
                    'title' => $wsInfo['name'] . ' (Session 1)',
                    'venue' => $wsInfo['venue'],
                    'what_to_bring' => $wsInfo['what_to_bring'],
                    'status' => 'CONFIRMED'
                ];

                // Add Day 2 Session (Atomic 2-session batch requirement)
                $scheduleDay2[] = [
                    'type' => 'PAID_WORKSHOP',
                    'time' => '09:30 – 11:30',
                    'title' => $wsInfo['name'] . ' (Session 2 & Project)',
                    'venue' => $wsInfo['venue'],
                    'what_to_bring' => $wsInfo['what_to_bring'],
                    'status' => 'CONFIRMED'
                ];
            } else {
                $dashboardData['bookings']['free_workshops'][] = [
                    'booking_reference' => $bk['booking_reference'],
                    'workshop_id' => $wsId,
                    'name' => $wsInfo['name'],
                    'status' => 'CONFIRMED',
                    'session' => 'Day 2 (14:00–15:00)'
                ];

                $scheduleDay2[] = [
                    'type' => 'FREE_WORKSHOP',
                    'time' => '14:00 – 15:00',
                    'title' => $wsInfo['name'],
                    'venue' => $wsInfo['venue'],
                    'what_to_bring' => $wsInfo['what_to_bring'],
                    'status' => 'CONFIRMED'
                ];
            }
        }

        // Grand Awards Ceremony on Day 3
        $scheduleDay3[] = [
            'type' => 'FESTIVAL_EVENT',
            'time' => '14:00 – 17:30',
            'title' => 'Grand Finale, Project Exhibits & Awards Ceremony',
            'venue' => 'Main Auditorium',
            'what_to_bring' => 'All Participants & Parents Welcome'
        ];

        // Pass colour hierarchy (I-5 Priority: Innovator > Competitor > Maker > Explorer)
        $hasPaidWorkshop = false;
        $hasCompetition = false;
        foreach ($dbBookings as $bk) {
            if ($bk['workshop_type'] === 'PAID') $hasPaidWorkshop = true;
        }
        if (isset($pdo) && $pdo instanceof PDO) {
            try {
                $cStmt = $pdo->prepare("SELECT COUNT(*) FROM competition_entries WHERE participant_id = ?");
                $cStmt->execute([$participant['id']]);
                if ($cStmt->fetchColumn() > 0) $hasCompetition = true;
            } catch (Exception $ce) {}
        }
        if ($hasPaidWorkshop && $hasCompetition) {
            $dashboardData['profile']['pass_colour'] = 'GOLD';
            $dashboardData['profile']['pass_colour_text'] = 'Innovator';
            $dashboardData['profile']['pass_colour_hex'] = '#f59e0b';
        } elseif ($hasCompetition) {
            $dashboardData['profile']['pass_colour'] = 'RED';
            $dashboardData['profile']['pass_colour_text'] = 'Competitor';
            $dashboardData['profile']['pass_colour_hex'] = '#ef4444';
        } elseif ($hasPaidWorkshop) {
            $dashboardData['profile']['pass_colour'] = 'BLUE';
            $dashboardData['profile']['pass_colour_text'] = 'Maker';
            $dashboardData['profile']['pass_colour_hex'] = '#2563eb';
        } else {
            $dashboardData['profile']['pass_colour'] = 'GREEN';
            $dashboardData['profile']['pass_colour_text'] = 'Explorer';
            $dashboardData['profile']['pass_colour_hex'] = '#10b981';
        }

        $dashboardData['my_schedule']['day_1'] = $scheduleDay1;
        $dashboardData['my_schedule']['day_2'] = $scheduleDay2;
        $dashboardData['my_schedule']['day_3'] = $scheduleDay3;
    }

    sendResponse(true, 'Dashboard loaded successfully.', $dashboardData);
}

else {
    sendResponse(false, 'Invalid dashboard action.', [], 404);
}
?>
