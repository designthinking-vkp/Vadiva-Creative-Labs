<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

// Security: Check if user is a coordinator
$coordinatorId = $_GET['coordinator_id'] ?? 0;
if (!$coordinatorId) {
    sendResponse(false, 'Coordinator ID required.');
}

// Fetch the school this coordinator manages
$stmt = $pdo->prepare('SELECT id, name FROM schools WHERE coordinator_user_id = ?');
$stmt->execute([$coordinatorId]);
$school = $stmt->fetch();

if (!$school) {
    sendResponse(false, 'Unauthorized or no school assigned.');
}
$schoolId = $school['id'];

if ($action === 'get_students') {
    $stmt = $pdo->prepare('
        SELECT id, full_name, participant_id, grade, section, entry_status
        FROM participants 
        WHERE school_id = ?
        ORDER BY grade ASC, full_name ASC
    ');
    $stmt->execute([$schoolId]);
    $students = $stmt->fetchAll();

    // Check Escort Ratio (1 escort per 20 students)
    $totalStudents = count($students);
    $requiredEscorts = ceil($totalStudents / 20);
    // In a real scenario we'd count registered escorts here

    sendResponse(true, 'Students loaded.', [
        'school_name' => $school['name'],
        'students' => $students,
        'escort_ratio' => [
            'total_students' => $totalStudents,
            'required_escorts' => $requiredEscorts
        ]
    ]);
}
// Add bulk registration, bulk payment, csv upload stubs here
else {
    sendResponse(false, 'Invalid action.');
}
?>
