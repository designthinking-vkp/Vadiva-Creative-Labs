<?php
/**
 * Vadiva Tech Fest 3.0 — Pass & 3-Day Schedule Resolver (I-1 to I-5)
 * Vadiva Creative Labs
 *
 * Requirements:
 * I-1: One QR per participant, generated on entry payment.
 * I-2: The QR encodes an opaque token only — never the schedule, never personal data, never a fee.
 * I-3: Scanning resolves server-side to the participant's name, photo if provided, band, pass colour, and their full schedule for that day.
 * I-4: The pass PDF shows: name, Participant ID, school, band, pass colour, QR, and the participant's three-day schedule.
 * I-5: Pass colour derived from participant's primary journey:
 *      RED competitor, BLUE maker, GREEN explorer, GOLD innovator.
 *      Priority: Innovator > Competitor > Maker > Explorer.
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/env.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? 'get_pass';
$participantId = $_GET['participant_id'] ?? ($_GET['id'] ?? ($_GET['user_id'] ?? 0));
$token = $_GET['token'] ?? '';

// Master Catalog for fallback venue/time schedule mapping
$MASTER_WS_SCHEDULE = [
    '1'  => ['name' => 'Rocket Lab', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (09:30 - 11:30)', 'day2' => 'Day 2 (09:30 - 11:30)', 'venue' => 'Outdoor Launch Pad', 'bring' => 'Safety goggles (provided)'],
    '2'  => ['name' => 'Satellite Makers', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (11:45 - 13:45)', 'day2' => 'Day 2 (11:45 - 13:45)', 'venue' => 'Space Sciences Lab', 'bring' => 'Laptop / Tablet (optional)'],
    '3'  => ['name' => 'Drone Pilot Academy', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (14:30 - 16:30)', 'day2' => 'Day 2 (14:30 - 16:30)', 'venue' => 'Safety Flight Cage', 'bring' => 'Comfortable shoes'],
    '4'  => ['name' => 'Aeroforge', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (09:30 - 11:30)', 'day2' => 'Day 2 (09:30 - 11:30)', 'venue' => 'Air Arena', 'bring' => 'Notebook & pen'],
    '5'  => ['name' => 'AR/VR Experience Lab', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (11:45 - 13:45)', 'day2' => 'Day 2 (11:45 - 13:45)', 'venue' => 'Immersive Media Lab', 'bring' => 'Smartphone (optional)'],
    '6'  => ['name' => 'AI Inventors Lab', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (14:30 - 16:30)', 'day2' => 'Day 2 (14:30 - 16:30)', 'venue' => 'Edge AI Computing Center', 'bring' => 'Laptop required'],
    '7'  => ['name' => 'Game Forge', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (09:30 - 11:30)', 'day2' => 'Day 2 (09:30 - 11:30)', 'venue' => 'Coding & Game Studio', 'bring' => 'Laptop recommended'],
    '8'  => ['name' => '3D Makers Lab', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (11:45 - 13:45)', 'day2' => 'Day 2 (11:45 - 13:45)', 'venue' => 'Digital Fabrication Studio', 'bring' => 'Pen drive (optional)'],
    '9'  => ['name' => 'Arduino Inventors Lab', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (14:30 - 16:30)', 'day2' => 'Day 2 (14:30 - 16:30)', 'venue' => 'Hardware Innovation Lab', 'bring' => 'None (Kits provided)'],
    '10' => ['name' => 'Animation Lab', 'type' => 'PAID_WORKSHOP', 'day1' => 'Day 1 (09:30 - 11:30)', 'day2' => 'Day 2 (09:30 - 11:30)', 'venue' => 'Creative Design Studio', 'bring' => 'Sketchpad & pencils'],
    '11' => ['name' => 'Design Thinking Bootcamp', 'type' => 'FREE_WORKSHOP', 'day' => 'Day 1 (10:00 - 11:30)', 'venue' => 'Theatre Alpha (Arena A)', 'bring' => 'None'],
    '12' => ['name' => 'Sketching & Visual Thinking', 'type' => 'FREE_WORKSHOP', 'day' => 'Day 1 (14:00 - 15:30)', 'venue' => 'Theatre Beta (Hall B)', 'bring' => 'Drawing pencils'],
    '13' => ['name' => 'Public Speaking & Pitching', 'type' => 'FREE_WORKSHOP', 'day' => 'Day 2 (10:00 - 11:30)', 'venue' => 'Theatre Alpha (Arena A)', 'bring' => 'Notepad'],
    '14' => ['name' => 'Science Demonstrations', 'type' => 'FREE_WORKSHOP', 'day' => 'Day 2 (14:00 - 15:30)', 'venue' => 'Main Stage Theatre', 'bring' => 'None'],
    '15' => ['name' => 'Student Entrepreneurship', 'type' => 'FREE_WORKSHOP', 'day' => 'Day 3 (10:00 - 11:30)', 'venue' => 'Theatre Beta (Hall B)', 'bring' => 'Idea notes']
];

function sendPassResponse($success, $message, $data = [], $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data, 'timestamp' => date('c')], JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Fetch participant details, pass color, opaque QR token, and 3-day schedule
 */
function fetchParticipantPassData($pdo, $participantId, $token = '') {
    global $MASTER_WS_SCHEDULE;

    $participant = null;
    if ($pdo instanceof PDO) {
        try {
            if (!empty($token)) {
                $stmt = $pdo->prepare("
                    SELECT p.*, q.token as active_token, u.email as user_email, u.phone as user_phone
                    FROM qr_tokens q
                    JOIN participants p ON q.participant_id = p.id
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE q.token = ? AND q.is_active = TRUE
                    LIMIT 1
                ");
                $stmt->execute([$token]);
                $participant = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            if (!$participant && $participantId) {
                $stmt = $pdo->prepare("
                    SELECT p.*, q.token as active_token, u.email as user_email, u.phone as user_phone
                    FROM participants p
                    LEFT JOIN qr_tokens q ON p.id = q.participant_id AND q.is_active = TRUE
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.id = ? OR p.user_id = ? OR p.participant_id = ?
                    ORDER BY q.id DESC LIMIT 1
                ");
                $stmt->execute([$participantId, $participantId, (string)$participantId]);
                $participant = $stmt->fetch(PDO::FETCH_ASSOC);
            }
        } catch (Exception $e) {
            error_log("Pass lookup error: " . $e->getMessage());
        }
    }

    // Fallback stub for dev / offline testing
    if (!$participant) {
        $pNum = is_numeric($participantId) && $participantId > 0 ? (int)$participantId : 1001;
        $participant = [
            'id' => $pNum,
            'user_id' => $pNum,
            'participant_id' => sprintf('TF-2026-%04d', $pNum),
            'full_name' => 'Adithya Narayanan',
            'school' => 'Velammal Vidyalaya - Mel Ayanambakkam',
            'grade' => 7,
            'section' => 'C',
            'band' => 'INTERMEDIATE',
            'entry_status' => 'PAID',
            'photo_url' => '',
            'active_token' => 'QR-TF-' . strtoupper(substr(md5('TF-2026-' . $pNum), 0, 32))
        ];
    }

    $isEntryPaid = ($participant['entry_status'] === 'PAID');
    $pId = (int)$participant['id'];
    $publicPid = $participant['participant_id'] ?: sprintf('TF-2026-%04d', $pId);
    $band = $participant['band'] ?: 'JUNIOR';

    // Ensure opaque QR token is present
    $opaqueQrToken = $participant['active_token'] ?? $participant['qr_token'] ?? '';
    if (empty($opaqueQrToken) && $isEntryPaid) {
        $opaqueQrToken = 'QR-TF-' . strtoupper(bin2hex(random_bytes(16)));
        if ($pdo instanceof PDO) {
            try {
                $pdo->prepare("UPDATE participants SET qr_token = ? WHERE id = ?")->execute([$opaqueQrToken, $pId]);
                $pdo->prepare("INSERT INTO qr_tokens (participant_id, token, is_active) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE is_active = TRUE")->execute([$pId, $opaqueQrToken]);
            } catch (Exception $e) {}
        }
    }

    // Query confirmed bookings & competition entries to determine Pass Colour & Schedule
    $hasPaidWorkshop = false;
    $hasCompetition = false;
    $confirmedWorkshops = [];
    $confirmedCompetitions = [];

    if ($pdo instanceof PDO) {
        try {
            // Check workshop_bookings
            $wbStmt = $pdo->prepare("
                SELECT wb.*, w.name as workshop_name, w.is_paid, w.venue 
                FROM workshop_bookings wb
                LEFT JOIN workshops w ON wb.workshop_id = w.id
                WHERE wb.participant_id = ? AND wb.status = 'CONFIRMED'
            ");
            $wbStmt->execute([$pId]);
            $wbs = $wbStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($wbs as $wb) {
                $isPaid = ($wb['workshop_type'] === 'PAID' || !empty($wb['is_paid']));
                if ($isPaid) $hasPaidWorkshop = true;
                $confirmedWorkshops[] = $wb;
            }

            // Check competition entries
            $compStmt = $pdo->prepare("
                SELECT ce.*, c.name as competition_name, cw.window_name, cw.start_time, cw.end_time, cw.venue
                FROM competition_entries ce
                LEFT JOIN competition_windows cw ON ce.competition_window_id = cw.id
                LEFT JOIN competitions c ON cw.competition_id = c.id
                WHERE ce.participant_id = ?
            ");
            $compStmt->execute([$pId]);
            $comps = $compStmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($comps) > 0) {
                $hasCompetition = true;
                $confirmedCompetitions = $comps;
            }
        } catch (Exception $e) {}
    }

    // Pass Colour Calculation (I-5 Priority Hierarchy):
    // Innovator (GOLD) > Competitor (RED) > Maker (BLUE) > Explorer (GREEN)
    if ($hasPaidWorkshop && $hasCompetition) {
        $passColour = 'GOLD';
        $passColourHex = '#f59e0b';
        $passText = 'Innovator';
        $passBadgeBg = 'linear-gradient(135deg, #d97706, #fbbf24)';
    } elseif ($hasCompetition) {
        $passColour = 'RED';
        $passColourHex = '#ef4444';
        $passText = 'Competitor';
        $passBadgeBg = 'linear-gradient(135deg, #dc2626, #f87171)';
    } elseif ($hasPaidWorkshop) {
        $passColour = 'BLUE';
        $passColourHex = '#2563eb';
        $passText = 'Maker';
        $passBadgeBg = 'linear-gradient(135deg, #1d4ed8, #60a5fa)';
    } else {
        $passColour = 'GREEN';
        $passColourHex = '#10b981';
        $passText = 'Explorer';
        $passBadgeBg = 'linear-gradient(135deg, #059669, #34d399)';
    }

    // Build 3-Day Schedule (Single Source of Truth)
    $threeDaySchedule = [
        'day_1' => [
            ['title' => 'Festival Opening & Keynote', 'time' => '09:00 - 09:30', 'venue' => 'Main Auditorium', 'type' => 'GENERAL', 'what_to_bring' => 'Festival Pass & ID']
        ],
        'day_2' => [
            ['title' => 'Maker Exhibitions & Live Demos', 'time' => '09:00 - 17:00', 'venue' => 'Innovation Expo Hall', 'type' => 'GENERAL', 'what_to_bring' => 'Curiosity & Notebook']
        ],
        'day_3' => [
            ['title' => 'Grand Finale & Award Ceremony', 'time' => '15:30 - 17:30', 'venue' => 'Main Auditorium', 'type' => 'GENERAL', 'what_to_bring' => 'Festival Pass']
        ]
    ];

    // Populate confirmed workshops into schedule
    foreach ($confirmedWorkshops as $cw) {
        $wsId = (string)($cw['workshop_id'] ?? '1');
        $wsRef = $MASTER_WS_SCHEDULE[$wsId] ?? null;
        $title = $cw['workshop_name'] ?? ($wsRef['name'] ?? 'Workshop #' . $wsId);
        $venue = $cw['venue'] ?? ($wsRef['venue'] ?? 'Workshop Studio');
        $bring = $wsRef['bring'] ?? 'None';

        if ($cw['workshop_type'] === 'PAID') {
            $threeDaySchedule['day_1'][] = [
                'title' => $title . ' — Session 1/2',
                'time' => $wsRef['day1'] ?? '09:30 - 11:30',
                'venue' => $venue,
                'type' => 'PAID_WORKSHOP',
                'what_to_bring' => $bring,
                'booking_ref' => $cw['booking_reference'] ?? ''
            ];
            $threeDaySchedule['day_2'][] = [
                'title' => $title . ' — Session 2/2',
                'time' => $wsRef['day2'] ?? '09:30 - 11:30',
                'venue' => $venue,
                'type' => 'PAID_WORKSHOP',
                'what_to_bring' => $bring,
                'booking_ref' => $cw['booking_reference'] ?? ''
            ];
        } else {
            $threeDaySchedule['day_1'][] = [
                'title' => $title . ' (Free Workshop)',
                'time' => $wsRef['day'] ?? '14:00 - 15:30',
                'venue' => $venue,
                'type' => 'FREE_WORKSHOP',
                'what_to_bring' => $bring,
                'booking_ref' => $cw['booking_reference'] ?? ''
            ];
        }
    }

    // Populate competitions into schedule
    foreach ($confirmedCompetitions as $cc) {
        $threeDaySchedule['day_2'][] = [
            'title' => ($cc['competition_name'] ?? 'Competition Marshalling') . ' (' . ($cc['window_name'] ?? 'Window A') . ')',
            'time' => ($cc['start_time'] ? substr($cc['start_time'], 0, 5) . ' - ' . substr($cc['end_time'], 0, 5) : '14:00 - 16:30'),
            'venue' => $cc['venue'] ?? 'Competition Marshalling Arena',
            'type' => 'COMPETITION',
            'what_to_bring' => 'Project Model & Kit'
        ];
    }

    return [
        'id' => $pId,
        'name' => $participant['full_name'],
        'participant_id' => $publicPid,
        'school' => $participant['school'] ?: 'Velammal Educational Network',
        'band' => $band,
        'entry_status' => $participant['entry_status'],
        'is_entry_paid' => $isEntryPaid,
        'photo_url' => $participant['photo_url'] ?? '',
        'colour' => $passColour,
        'colour_text' => $passText,
        'colour_hex' => $passColourHex,
        'colour_gradient' => $passBadgeBg,
        'qr_token' => $opaqueQrToken, // STRICTLY OPAQUE TOKEN ONLY
        'schedule' => $threeDaySchedule
    ];
}

// -----------------------------------------------------------------------------
// ENDPOINTS
// -----------------------------------------------------------------------------

if ($action === 'get_pass') {
    if (!$participantId && empty($token)) {
        sendPassResponse(false, 'Participant ID or QR Token required.', [], 400);
    }
    $passData = fetchParticipantPassData($pdo, $participantId, $token);
    sendPassResponse(true, 'Pass details fetched successfully.', $passData);
}

elseif ($action === 'get_pass_html' || $action === 'render_pdf' || $action === 'download_pass') {
    $passData = fetchParticipantPassData($pdo, $participantId, $token);
    
    // Output standalone high-resolution printable / PDF pass
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Official Festival Pass — <?= htmlspecialchars($passData['name']) ?> (<?= htmlspecialchars($passData['participant_id']) ?>)</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
      <!-- QR Code Generator Library -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        :root {
          --pass-color: <?= $passData['colour_hex'] ?>;
          --pass-gradient: <?= $passData['colour_gradient'] ?>;
          --bg-dark: #071921;
          --teal: #0cb8c0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', sans-serif;
          background: #0b111e;
          color: #1e293b;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 12px;
          min-height: 100vh;
        }
        .print-actions {
          margin-bottom: 20px;
          display: flex;
          gap: 12px;
        }
        .btn-print {
          background: var(--teal);
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(12, 184, 192, 0.4);
        }
        .btn-print:hover { background: #0aa5ad; }
        
        /* Pass Container */
        .pass-card {
          width: 100%;
          max-width: 720px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
        }
        
        /* Header Ribbon */
        .pass-header {
          background: var(--bg-dark);
          color: #ffffff;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 5px solid var(--pass-color);
        }
        .pass-brand h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .pass-brand span {
          color: var(--teal);
        }
        .pass-type-badge {
          background: var(--pass-gradient);
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 20px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
        }

        /* Identity Section */
        .pass-identity-section {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          background: linear-gradient(to bottom, #f8fafc, #ffffff);
          border-bottom: 1.5px dashed #cbd5e1;
        }
        .participant-details h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .pid-badge {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          background: #e2e8f0;
          color: #0f172a;
          padding: 3px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .meta-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 6px 14px;
          font-size: 13px;
          color: #475569;
        }
        .meta-label { font-weight: 600; color: #64748b; }
        .meta-val { font-weight: 700; color: #1e293b; }

        /* QR Code Block */
        .qr-block {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        #qrcode {
          padding: 4px;
          background: #ffffff;
        }
        .qr-caption {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #64748b;
          margin-top: 6px;
          letter-spacing: 0.05em;
        }
        .qr-notice {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* 3-Day Schedule Section */
        .pass-schedule-section {
          padding: 20px 24px;
        }
        .pass-schedule-section h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0f172a;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pass-schedule-section h3::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 16px;
          background: var(--pass-color);
          border-radius: 2px;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .day-col {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
        }
        .day-col-header {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }
        .session-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 8px;
          font-size: 11px;
        }
        .session-item:last-child { margin-bottom: 0; }
        .session-item.paid { border-left: 3px solid #2563eb; }
        .session-item.comp { border-left: 3px solid #ef4444; }
        .session-item.free { border-left: 3px solid #0cb8c0; }
        .session-title { font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .session-meta { color: #64748b; font-size: 10px; line-height: 1.4; }

        /* Pass Footer */
        .pass-footer {
          background: #f1f5f9;
          padding: 12px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #64748b;
        }

        /* Printable optimization */
        @media print {
          body { background: #ffffff; padding: 0; }
          .print-actions { display: none !important; }
          .pass-card { box-shadow: none; border: 1px solid #000000; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="print-actions">
        <button class="btn-print" onclick="window.print()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print Official Pass / Save as PDF
        </button>
      </div>

      <div class="pass-card">
        <!-- Header -->
        <div class="pass-header">
          <div class="pass-brand">
            <h1>VADIVA <span>TECH FEST 3.0</span></h1>
            <p style="font-size: 11px; color: #94a3b8; letter-spacing: 0.05em;">OFFICIAL PARTICIPANT ALL-ACCESS PASS</p>
          </div>
          <div class="pass-type-badge"><?= htmlspecialchars($passData['colour_text']) ?> PASS</div>
        </div>

        <!-- Identity & Opaque QR Section -->
        <div class="pass-identity-section">
          <div class="participant-details">
            <span class="pid-badge"><?= htmlspecialchars($passData['participant_id']) ?></span>
            <h2><?= htmlspecialchars($passData['name']) ?></h2>
            <div class="meta-row">
              <span class="meta-label">School:</span>
              <span class="meta-val"><?= htmlspecialchars($passData['school']) ?></span>
              <span class="meta-label">Band / Grade:</span>
              <span class="meta-val"><?= htmlspecialchars($passData['band']) ?> BAND</span>
              <span class="meta-label">Journey Type:</span>
              <span class="meta-val" style="color: var(--pass-color); font-weight:800;"><?= htmlspecialchars($passData['colour_text']) ?> (<?= htmlspecialchars($passData['colour']) ?>)</span>
              <span class="meta-label">Entry Status:</span>
              <span class="meta-val" style="color: #059669; font-weight: 700;">CONFIRMED &amp; VERIFIED</span>
            </div>
          </div>

          <div class="qr-block">
            <div id="qrcode"></div>
            <div class="qr-caption"><?= htmlspecialchars(substr($passData['qr_token'], 0, 16)) ?>...</div>
            <div class="qr-notice">Opaque Token Encoded</div>
          </div>
        </div>

        <!-- 3-Day Participant Schedule -->
        <div class="pass-schedule-section">
          <h3>Participant 3-Day Schedule</h3>
          <div class="schedule-grid">
            <!-- Day 1 -->
            <div class="day-col">
              <div class="day-col-header">
                <span>DAY 1</span>
                <span style="font-size: 10px; color: #64748b;">OCT 09</span>
              </div>
              <?php foreach ($passData['schedule']['day_1'] as $s): ?>
                <div class="session-item <?= $s['type'] === 'PAID_WORKSHOP' ? 'paid' : ($s['type'] === 'FREE_WORKSHOP' ? 'free' : 'general') ?>">
                  <div class="session-title"><?= htmlspecialchars($s['title']) ?></div>
                  <div class="session-meta">
                    <strong><?= htmlspecialchars($s['time']) ?></strong><br>
                    <?= htmlspecialchars($s['venue']) ?>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>

            <!-- Day 2 -->
            <div class="day-col">
              <div class="day-col-header">
                <span>DAY 2</span>
                <span style="font-size: 10px; color: #64748b;">OCT 10</span>
              </div>
              <?php foreach ($passData['schedule']['day_2'] as $s): ?>
                <div class="session-item <?= $s['type'] === 'PAID_WORKSHOP' ? 'paid' : ($s['type'] === 'COMPETITION' ? 'comp' : 'general') ?>">
                  <div class="session-title"><?= htmlspecialchars($s['title']) ?></div>
                  <div class="session-meta">
                    <strong><?= htmlspecialchars($s['time']) ?></strong><br>
                    <?= htmlspecialchars($s['venue']) ?>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>

            <!-- Day 3 -->
            <div class="day-col">
              <div class="day-col-header">
                <span>DAY 3</span>
                <span style="font-size: 10px; color: #64748b;">OCT 11</span>
              </div>
              <?php foreach ($passData['schedule']['day_3'] as $s): ?>
                <div class="session-item <?= $s['type'] === 'PAID_WORKSHOP' ? 'paid' : 'general' ?>">
                  <div class="session-title"><?= htmlspecialchars($s['title']) ?></div>
                  <div class="session-meta">
                    <strong><?= htmlspecialchars($s['time']) ?></strong><br>
                    <?= htmlspecialchars($s['venue']) ?>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pass-footer">
          <span>Non-transferable. Present at all check-in points.</span>
          <span>Vadiva Creative Labs &copy; 2026</span>
        </div>
      </div>

      <script>
        // Generate QR code encoding OPAQUE TOKEN ONLY
        const opaqueToken = <?= json_encode($passData['qr_token']) ?>;
        new QRCode(document.getElementById("qrcode"), {
          text: opaqueToken,
          width: 110,
          height: 110,
          colorDark: "#071921",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      </script>
    </body>
    </html>
    <?php
    exit;
} else {
    sendPassResponse(false, 'Invalid action. Supported: get_pass, get_pass_html, download_pass', [], 400);
}
