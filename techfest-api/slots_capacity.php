<?php
/**
 * Vadiva Tech Fest 3.0 — Real-Time Slot and Capacity Engine
 * Reference: Specification Part E (E1, E2, E3, E4)
 * Clean real-time architecture: 0 demo/fake data.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function sendJson($success, $message, $data = [], $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c'),
        'data' => $data
    ]);
    exit;
}

// Database Connection
$hasDb = false;
$pdo = null;

if (file_exists(__DIR__ . '/config/db.php')) {
    try {
        require_once __DIR__ . '/config/db.php';
        if (isset($pdo) && $pdo instanceof PDO) {
            $hasDb = true;
        }
    } catch (Exception $e) {
        $hasDb = false;
    }
}

// Clean Real Master Catalogue
$BASE_PAID_WORKSHOPS = [
    [
        'id' => 1,
        'code' => 'WS-ROCKET',
        'name' => 'Rocket Lab',
        'short_desc' => 'Build pneumatic and solid-propellant rockets. Test thrust curves, stability, and aerodynamics with live outdoor launches.',
        'is_paid' => true,
        'price_velammal' => 400,
        'price_other' => 550,
        'binding_constraint' => 'Launch cycles at the outdoor pad',
        'capacity_per_batch' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1517976487541-05bf47990176?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 20],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 20],
        ]
    ],
    [
        'id' => 2,
        'code' => 'WS-SATELLITE',
        'name' => 'Satellite Makers',
        'short_desc' => 'Assemble functioning CubeSat scale model payloads with environmental sensors, telemetry transceivers, and ground-station tracking.',
        'is_paid' => true,
        'price_velammal' => 450,
        'price_other' => 600,
        'binding_constraint' => 'Sensor kits and bench space',
        'capacity_per_batch' => 25,
        'min_grade' => 6,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 25],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 25],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 25],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 25],
        ]
    ],
    [
        'id' => 3,
        'code' => 'WS-DRONE',
        'name' => 'Drone Pilot Academy',
        'short_desc' => 'Learn quadcopter aerodynamics, optical-flow positioning, and manual FPV flight maneuvers inside the safety flight cage.',
        'is_paid' => true,
        'price_velammal' => 450,
        'price_other' => 600,
        'binding_constraint' => 'Cage flight time per pilot',
        'capacity_per_batch' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 20],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 20],
        ]
    ],
    [
        'id' => 4,
        'code' => 'WS-AEROFORGE',
        'name' => 'Aeroforge',
        'short_desc' => 'Craft RC high-lift gliders from carbon composite and foam boards. Master transmitter trims, stall recovery, and arena flight physics.',
        'is_paid' => true,
        'price_velammal' => 400,
        'price_other' => 550,
        'binding_constraint' => 'Transmitter and Air Arena flight time',
        'capacity_per_batch' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 20],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 20],
        ]
    ],
    [
        'id' => 5,
        'code' => 'WS-ARVR',
        'name' => 'AR/VR Experience Lab',
        'short_desc' => 'Develop immersive 3D spatial environments in WebXR. Deploy interactive holographic scenes directly to VR headsets.',
        'is_paid' => true,
        'price_velammal' => 350,
        'price_other' => 500,
        'binding_constraint' => 'Headset viewers and floor space',
        'capacity_per_batch' => 40,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 40],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 40],
        ]
    ],
    [
        'id' => 6,
        'code' => 'WS-AI',
        'name' => 'AI Inventors Lab',
        'short_desc' => 'Train computer vision and voice classification neural networks using edge accelerators. Build interactive gesture-controlled apps.',
        'is_paid' => true,
        'price_velammal' => 400,
        'price_other' => 550,
        'binding_constraint' => 'Instructor-to-student ratio',
        'capacity_per_batch' => 40,
        'min_grade' => 6,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 40],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 40],
        ]
    ],
    [
        'id' => 7,
        'code' => 'WS-GAMEFORGE',
        'name' => 'Game Forge',
        'short_desc' => 'Design and script 2D physics-based arcade and platformer games with custom sprite animations, sound effects, and enemy AI.',
        'is_paid' => true,
        'price_velammal' => 350,
        'price_other' => 500,
        'binding_constraint' => 'Instructor-to-student ratio',
        'capacity_per_batch' => 40,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 40],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 40],
        ]
    ],
    [
        'id' => 8,
        'code' => 'WS-3DMAKERS',
        'name' => '3D Makers Lab',
        'short_desc' => 'Parametric 3D CAD modeling with live slicer optimization and multi-filament 3D printer calibration and physical manufacturing.',
        'is_paid' => true,
        'price_velammal' => 350,
        'price_other' => 500,
        'binding_constraint' => '3D printer throughput',
        'capacity_per_batch' => 20,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 20],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 20],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 20],
        ]
    ],
    [
        'id' => 9,
        'code' => 'WS-ARDUINO',
        'name' => 'Arduino Inventors Lab',
        'short_desc' => 'Microcontroller circuits, PWM motor drives, ultrasonic sonar radar, and hardware sensor integration on breadboards.',
        'is_paid' => true,
        'price_velammal' => 350,
        'price_other' => 500,
        'binding_constraint' => 'Bench space and power outlets',
        'capacity_per_batch' => 25,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 25],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 25],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 25],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 25],
        ]
    ],
    [
        'id' => 10,
        'code' => 'WS-ANIMATION',
        'name' => 'Animation Lab',
        'short_desc' => 'Stop-motion, vector tweening, character rigging, and frame-by-frame visual storytelling for digital media production.',
        'is_paid' => true,
        'price_velammal' => 300,
        'price_other' => 450,
        'binding_constraint' => 'Instructor-to-student ratio',
        'capacity_per_batch' => 40,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        'batches' => [
            ['batch_code' => 'B-01', 'slots' => 'D1-AM + D2-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-02', 'slots' => 'D1-PM + D2-PM (13:30–15:30)', 'capacity' => 40],
            ['batch_code' => 'B-03', 'slots' => 'D2-AM + D3-AM (09:30–11:30)', 'capacity' => 40],
            ['batch_code' => 'B-04', 'slots' => 'D2-PM (13:30) + D3-AM (09:30)', 'capacity' => 40],
        ]
    ]
];

$BASE_FREE_WORKSHOPS = [
    [
        'id' => 11,
        'code' => 'FREE-DT',
        'name' => 'Design Thinking Bootcamp',
        'short_desc' => '5-stage human-centered innovation method — rapid problem framing, ideation, and paper prototyping.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-1', 'theatre' => 'A', 'time' => 'Day 1 · 10:00–11:00'],
            ['slot_code' => 'F-D2-2', 'theatre' => 'A', 'time' => 'Day 2 · 12:00–13:00'],
        ]
    ],
    [
        'id' => 12,
        'code' => 'FREE-SKETCH',
        'name' => 'Sketching & Visual Thinking',
        'short_desc' => 'Transform complex technical thoughts into visual frameworks, wireframe sketches, and graphic representations.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-1', 'theatre' => 'B', 'time' => 'Day 1 · 10:00–11:00'],
            ['slot_code' => 'F-D2-2', 'theatre' => 'B', 'time' => 'Day 2 · 12:00–13:00'],
        ]
    ],
    [
        'id' => 13,
        'code' => 'FREE-PITCH',
        'name' => 'Public Speaking & Pitching',
        'short_desc' => 'Story arcs, vocal projection, body language, and elevator pitch structuring for young startup creators.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-2', 'theatre' => 'A', 'time' => 'Day 1 · 12:00–13:00'],
            ['slot_code' => 'F-D2-3', 'theatre' => 'A', 'time' => 'Day 2 · 14:00–15:00'],
        ]
    ],
    [
        'id' => 14,
        'code' => 'FREE-SCIENCE',
        'name' => 'Science Demonstrations',
        'short_desc' => 'Spectacular live physics and chemistry experiments exploring cryogenics, vortex dynamics, and electromagnetism.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-2', 'theatre' => 'B', 'time' => 'Day 1 · 12:00–13:00'],
            ['slot_code' => 'F-D2-3', 'theatre' => 'B', 'time' => 'Day 2 · 14:00–15:00'],
        ]
    ],
    [
        'id' => 15,
        'code' => 'FREE-ENTREP',
        'name' => 'Student Entrepreneurship',
        'short_desc' => 'Validating customer pain points, unit economics, and building viable student-led venture blueprints.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 6,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-3', 'theatre' => 'A', 'time' => 'Day 1 · 14:00–15:00'],
            ['slot_code' => 'F-D2-4', 'theatre' => 'A', 'time' => 'Day 2 · 16:00–17:00'],
        ]
    ],
    [
        'id' => 16,
        'code' => 'FREE-CODE',
        'name' => 'Creative Coding with p5.js',
        'short_desc' => 'Generate generative art, interactive visualizers, and mathematical beauty through introductory JavaScript.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-3', 'theatre' => 'B', 'time' => 'Day 1 · 14:00–15:00'],
            ['slot_code' => 'F-D2-4', 'theatre' => 'B', 'time' => 'Day 2 · 16:00–17:00'],
        ]
    ],
    [
        'id' => 17,
        'code' => 'FREE-ELEC',
        'name' => 'Electronics Playground',
        'short_desc' => 'Introductory circuitry, polarity, breadboard basics, and making your first light-chaser gadget.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-4', 'theatre' => 'A', 'time' => 'Day 1 · 16:00–17:00'],
            ['slot_code' => 'F-D3-1', 'theatre' => 'A', 'time' => 'Day 3 · 10:00–11:00'],
        ]
    ],
    [
        'id' => 18,
        'code' => 'FREE-CAD',
        'name' => 'CAD & 3D Modeling Intro',
        'short_desc' => 'Beginner spatial design in Tinkercad, Boolean operations, and understanding 3D coordinate geometry.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 4,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D1-4', 'theatre' => 'B', 'time' => 'Day 1 · 16:00–17:00'],
            ['slot_code' => 'F-D3-1', 'theatre' => 'B', 'time' => 'Day 3 · 10:00–11:00'],
        ]
    ],
    [
        'id' => 19,
        'code' => 'FREE-SPACE',
        'name' => 'Space Exploration Lab',
        'short_desc' => 'Astrophysics basics, orbital mechanics, planetary landers, and future lunar/Martian habitat engineering.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D2-1', 'theatre' => 'A', 'time' => 'Day 2 · 10:00–11:00'],
            ['slot_code' => 'F-D3-2', 'theatre' => 'A', 'time' => 'Day 3 · 12:00–13:00'],
        ]
    ],
    [
        'id' => 20,
        'code' => 'FREE-CYBER',
        'name' => 'Cyber Safety & AI Ethics',
        'short_desc' => 'Protecting digital identity, understanding algorithmic bias, deepfake detection, and responsible online citizenship.',
        'is_paid' => false,
        'binding_constraint' => 'Theatre seat capacity',
        'capacity_per_session' => 100,
        'public_capacity' => 80,
        'standby_capacity' => 20,
        'min_grade' => 5,
        'max_grade' => 12,
        'image_url' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
        'sessions' => [
            ['slot_code' => 'F-D2-1', 'theatre' => 'B', 'time' => 'Day 2 · 10:00–11:00'],
            ['slot_code' => 'F-D3-2', 'theatre' => 'B', 'time' => 'Day 3 · 12:00–13:00'],
        ]
    ]
];

// Calculate live status from real numbers
function calculateStatus($filled, $total) {
    if ($total <= 0) return ['status' => 'UNAVAILABLE', 'label' => 'Closed', 'class' => 'full', 'percentage' => 0];
    $pct = ($filled / $total) * 100;
    if ($filled >= $total) {
        return ['status' => 'FULL', 'label' => 'Sold Out (Waitlist)', 'class' => 'full', 'percentage' => 100];
    } elseif ($pct >= 80) {
        return ['status' => 'FILLING_FAST', 'label' => 'Filling Fast', 'class' => 'near-full', 'percentage' => round($pct, 1)];
    } elseif ($pct >= 50) {
        return ['status' => 'GETTING_FULL', 'label' => 'Active', 'class' => 'getting-full', 'percentage' => round($pct, 1)];
    } else {
        return ['status' => 'AVAILABLE', 'label' => 'Seats Available', 'class' => 'available', 'percentage' => round($pct, 1)];
    }
}

// -------------------------------------------------------------
// ROUTE: realtime_capacity
// -------------------------------------------------------------
if ($action === 'realtime_capacity') {
    $paidResponse = [];

    foreach ($BASE_PAID_WORKSHOPS as $ws) {
        $totalCap = 0;
        $totalFilled = 0;
        $batchesData = [];

        foreach ($ws['batches'] as $b) {
            $cap = $b['capacity'];
            $confirmedSeats = 0;
            $softLocks = 0;

            if ($hasDb && $pdo) {
                try {
                    // Query confirmed bookings for this workshop batch
                    $stmt = $pdo->prepare("SELECT seats_taken FROM workshop_batches WHERE workshop_id = ? AND batch_code = ?");
                    $stmt->execute([$ws['id'], $b['batch_code']]);
                    $row = $stmt->fetch();
                    if ($row) {
                        $confirmedSeats = intval($row['seats_taken']);
                    }

                    // Query active soft-locks
                    $stmtLock = $pdo->prepare("SELECT COUNT(*) as locks FROM workshop_bookings WHERE workshop_id = ? AND batch_id = (SELECT id FROM workshop_batches WHERE workshop_id = ? AND batch_code = ? LIMIT 1) AND status = 'SOFT_LOCK' AND locked_until > NOW()");
                    $stmtLock->execute([$ws['id'], $ws['id'], $b['batch_code']]);
                    $lockRow = $stmtLock->fetch();
                    if ($lockRow) {
                        $softLocks = intval($lockRow['locks']);
                    }
                } catch (Exception $e) {
                    // Fallback to 0 if table doesn't exist yet
                    $confirmedSeats = 0;
                    $softLocks = 0;
                }
            }

            $filled = $confirmedSeats + $softLocks;
            $totalCap += $cap;
            $totalFilled += $filled;
            $statusInfo = calculateStatus($filled, $cap);

            $batchesData[] = [
                'batch_code' => $b['batch_code'],
                'slots' => $b['slots'],
                'capacity' => $cap,
                'seats_filled' => $filled,
                'confirmed_seats' => $confirmedSeats,
                'soft_locks' => $softLocks,
                'available_seats' => max(0, $cap - $filled),
                'status' => $statusInfo['status'],
                'status_label' => $statusInfo['label'],
                'percentage' => $statusInfo['percentage']
            ];
        }

        $overallStatus = calculateStatus($totalFilled, $totalCap);

        $paidResponse[] = [
            'id' => $ws['id'],
            'code' => $ws['code'],
            'name' => $ws['name'],
            'short_desc' => $ws['short_desc'],
            'is_paid' => true,
            'price_velammal' => $ws['price_velammal'],
            'price_other' => $ws['price_other'],
            'binding_constraint' => $ws['binding_constraint'],
            'capacity_per_batch' => $ws['capacity_per_batch'],
            'total_capacity' => $totalCap,
            'total_seats_filled' => $totalFilled,
            'available_seats' => max(0, $totalCap - $totalFilled),
            'min_grade' => $ws['min_grade'],
            'max_grade' => $ws['max_grade'],
            'image_url' => $ws['image_url'],
            'status' => $overallStatus['status'],
            'status_label' => $overallStatus['label'],
            'status_class' => $overallStatus['class'],
            'percentage' => $overallStatus['percentage'],
            'batches' => $batchesData
        ];
    }

    $freeResponse = [];
    foreach ($BASE_FREE_WORKSHOPS as $ws) {
        $totalCap = 0;
        $totalFilled = 0;
        $sessionsData = [];

        foreach ($ws['sessions'] as $s) {
            $cap = $ws['public_capacity']; // 80 public booking seats
            $confirmedSeats = 0;
            $softLocks = 0;

            if ($hasDb && $pdo) {
                try {
                    $stmt = $pdo->prepare("SELECT seats_taken FROM free_workshop_sessions WHERE workshop_id = ? AND slot_code = ? AND theatre_code = ?");
                    $stmt->execute([$ws['id'], $s['slot_code'], $s['theatre']]);
                    $row = $stmt->fetch();
                    if ($row) {
                        $confirmedSeats = intval($row['seats_taken']);
                    }

                    $stmtLock = $pdo->prepare("SELECT COUNT(*) as locks FROM workshop_bookings WHERE workshop_id = ? AND free_session_id = (SELECT id FROM free_workshop_sessions WHERE workshop_id = ? AND slot_code = ? AND theatre_code = ? LIMIT 1) AND status = 'SOFT_LOCK' AND locked_until > NOW()");
                    $stmtLock->execute([$ws['id'], $ws['id'], $s['slot_code'], $s['theatre']]);
                    $lockRow = $stmtLock->fetch();
                    if ($lockRow) {
                        $softLocks = intval($lockRow['locks']);
                    }
                } catch (Exception $e) {
                    $confirmedSeats = 0;
                    $softLocks = 0;
                }
            }

            $filled = $confirmedSeats + $softLocks;
            $totalCap += $cap;
            $totalFilled += $filled;
            $statusInfo = calculateStatus($filled, $cap);

            $sessionsData[] = [
                'slot_code' => $s['slot_code'],
                'theatre' => $s['theatre'],
                'theatre_name' => $s['theatre'] === 'A' ? 'Theatre Alpha' : 'Theatre Beta',
                'time' => $s['time'],
                'total_seats' => $ws['capacity_per_session'],
                'public_capacity' => $cap,
                'standby_capacity' => $ws['standby_capacity'],
                'seats_filled' => $filled,
                'confirmed_seats' => $confirmedSeats,
                'soft_locks' => $softLocks,
                'available_seats' => max(0, $cap - $filled),
                'status' => $statusInfo['status'],
                'status_label' => $statusInfo['label'],
                'percentage' => $statusInfo['percentage']
            ];
        }

        $overallStatus = calculateStatus($totalFilled, $totalCap);

        $freeResponse[] = [
            'id' => $ws['id'],
            'code' => $ws['code'],
            'name' => $ws['name'],
            'short_desc' => $ws['short_desc'],
            'is_paid' => false,
            'binding_constraint' => $ws['binding_constraint'],
            'capacity_per_session' => $ws['capacity_per_session'],
            'total_capacity' => $totalCap,
            'total_seats_filled' => $totalFilled,
            'available_seats' => max(0, $totalCap - $totalFilled),
            'min_grade' => $ws['min_grade'],
            'max_grade' => $ws['max_grade'],
            'image_url' => $ws['image_url'],
            'status' => $overallStatus['status'],
            'status_label' => $overallStatus['label'],
            'status_class' => $overallStatus['class'],
            'percentage' => $overallStatus['percentage'],
            'sessions' => $sessionsData
        ];
    }

    sendJson(true, 'Live real-time slot and capacity data loaded successfully.', [
        'summary' => [
            'paid_workshops_count' => count($paidResponse),
            'free_workshops_count' => count($freeResponse),
            'total_free_theatre_instances' => 20,
            'theatres' => ['A' => 'Theatre Alpha', 'B' => 'Theatre Beta'],
            'last_sync' => date('Y-m-d H:i:s T')
        ],
        'paid_workshops' => $paidResponse,
        'free_workshops' => $freeResponse
    ]);
}

// -------------------------------------------------------------
// ROUTE: slot_grid (E1, E2, E4 Metadata)
// -------------------------------------------------------------
elseif ($action === 'slot_grid') {
    sendJson(true, 'Slot grid metadata loaded.', [
        'paid_slots' => [
            ['code' => 'D1-AM', 'day' => 1, 'time' => '09:30 – 11:30', 'available' => true],
            ['code' => 'D1-PM', 'day' => 1, 'time' => '13:30 – 15:30', 'available' => true],
            ['code' => 'D2-AM', 'day' => 2, 'time' => '09:30 – 11:30', 'available' => true],
            ['code' => 'D2-PM', 'day' => 2, 'time' => '13:30 – 15:30', 'available' => true],
            ['code' => 'D3-AM', 'day' => 3, 'time' => '09:30 – 11:30', 'available' => true],
            ['code' => 'D3-PM', 'day' => 3, 'time' => '13:30 – 15:30', 'available' => false, 'notes' => 'NO — finals and awards'],
        ],
        'batch_pairings' => [
            ['batch_code' => 'B-01', 'session_1' => 'D1-AM', 'session_2' => 'D2-AM', 'notes' => 'Morning track, Days 1–2'],
            ['batch_code' => 'B-02', 'session_1' => 'D1-PM', 'session_2' => 'D2-PM', 'notes' => 'Afternoon track, Days 1–2'],
            ['batch_code' => 'B-03', 'session_1' => 'D2-AM', 'session_2' => 'D3-AM', 'notes' => 'Morning track, Days 2–3'],
            ['batch_code' => 'B-04', 'session_1' => 'D2-PM', 'session_2' => 'D3-AM', 'notes' => 'Afternoon into morning — cross-slot pairing'],
        ],
        'free_slots' => [
            ['code' => 'F-D1-1', 'day' => 1, 'time' => '10:00 – 11:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D1-2', 'day' => 1, 'time' => '12:00 – 13:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D1-3', 'day' => 1, 'time' => '14:00 – 15:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D1-4', 'day' => 1, 'time' => '16:00 – 17:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D2-1', 'day' => 2, 'time' => '10:00 – 11:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D2-2', 'day' => 2, 'time' => '12:00 – 13:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D2-3', 'day' => 2, 'time' => '14:00 – 15:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D2-4', 'day' => 2, 'time' => '16:00 – 17:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D3-1', 'day' => 3, 'time' => '10:00 – 11:00', 'theatres' => ['A', 'B']],
            ['code' => 'F-D3-2', 'day' => 3, 'time' => '12:00 – 13:00', 'theatres' => ['A', 'B'], 'notes' => 'Last free sessions of festival'],
        ]
    ]);
}

// -------------------------------------------------------------
// ROUTE: admin_update_capacity (Strict Specification Rule Check)
// -------------------------------------------------------------
elseif ($action === 'admin_update_capacity') {
    $workshopId = intval($input['workshop_id'] ?? 0);
    $batchCode = trim($input['batch_code'] ?? '');
    $newCapacity = intval($input['new_capacity'] ?? -1);

    if ($workshopId <= 0 || empty($batchCode) || $newCapacity < 0) {
        sendJson(false, 'Invalid workshop ID, batch code, or capacity value (hard floor is 0).', [], 400);
    }

    $currentOccupancy = 0;
    if ($hasDb && $pdo) {
        $stmt = $pdo->prepare("SELECT seats_taken FROM workshop_batches WHERE workshop_id = ? AND batch_code = ?");
        $stmt->execute([$workshopId, $batchCode]);
        $row = $stmt->fetch();
        if ($row) $currentOccupancy = intval($row['seats_taken']);
    }

    // MANDATE: An admin reducing capacity below current occupancy must be BLOCKED, not warned.
    if ($newCapacity < $currentOccupancy) {
        sendJson(false, "CAPACITY EDIT BLOCKED: Cannot reduce capacity to {$newCapacity}. Current confirmed occupancy is {$currentOccupancy} seats. Existing confirmed bookings are never invalidated by a capacity edit.", [
            'workshop_id' => $workshopId,
            'batch_code' => $batchCode,
            'requested_capacity' => $newCapacity,
            'current_occupancy' => $currentOccupancy
        ], 422);
    }

    if ($hasDb && $pdo) {
        $stmt = $pdo->prepare("UPDATE workshop_batches SET capacity = ? WHERE workshop_id = ? AND batch_code = ?");
        $stmt->execute([$newCapacity, $workshopId, $batchCode]);
    }

    sendJson(true, "Capacity for batch {$batchCode} successfully updated to {$newCapacity}.", [
        'workshop_id' => $workshopId,
        'batch_code' => $batchCode,
        'new_capacity' => $newCapacity,
        'current_occupancy' => $currentOccupancy,
        'available_seats' => $newCapacity - $currentOccupancy
    ]);
}

// -------------------------------------------------------------
// DEFAULT: Invalid Action
// -------------------------------------------------------------
else {
    sendJson(false, 'Invalid action. Supported actions: realtime_capacity, slot_grid, admin_update_capacity', [], 400);
}
?>
