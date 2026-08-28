<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($action === 'create_participant') {
    $userId = $input['user_id'] ?? 0;
    $fullName = $input['full_name'] ?? '';
    $grade = (int)($input['grade'] ?? 0);
    $section = $input['section'] ?? '';
    $dob = $input['date_of_birth'] ?? '';
    $guardianName = $input['guardian_name'] ?? '';
    $guardianMobile = $input['guardian_mobile'] ?? '';
    $schoolId = $input['school_id'] ?? null;
    $newSchoolName = $input['new_school_name'] ?? '';
    $newSchoolCity = $input['new_school_city'] ?? '';

    if (!$userId || empty($fullName) || !$grade || empty($dob) || empty($guardianName) || empty($guardianMobile)) {
        sendResponse(false, 'Missing required participant fields.');
    }

    $band = 'OTHER';
    if ($grade >= 4 && $grade <= 6) {
        $band = 'JUNIOR';
    } elseif ($grade >= 7 && $grade <= 9) {
        $band = 'INTERMEDIATE';
    } elseif ($grade >= 10 && $grade <= 12) {
        $band = 'SENIOR';
    } else {
        sendResponse(false, 'Grade must be between 4 and 12.');
    }

    try {
        $pdo->beginTransaction();

        $tier = 'OTHER';
        if ($schoolId) {
            $stmt = $pdo->prepare('SELECT tier FROM schools WHERE id = ?');
            $stmt->execute([$schoolId]);
            $school = $stmt->fetch();
            if ($school) {
                $tier = $school['tier'];
            } else {
                throw new Exception('Invalid school ID.');
            }
        } elseif (!empty($newSchoolName)) {
            $stmt = $pdo->prepare('INSERT INTO schools (name, city, is_active, tier) VALUES (?, ?, FALSE, ?)');
            $stmt->execute([$newSchoolName, $newSchoolCity, 'OTHER']);
            $schoolId = $pdo->lastInsertId();
            $tier = 'OTHER';
        } else {
            throw new Exception('School selection is required.');
        }

        $stmt = $pdo->prepare('
            INSERT INTO participants (
                user_id, school_id, full_name, grade, section, date_of_birth,
                guardian_name, guardian_mobile, band, tier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId, $schoolId, $fullName, $grade, $section, $dob,
            $guardianName, $guardianMobile, $band, $tier
        ]);
        
        $participantId = $pdo->lastInsertId();

        $pdo->commit();
        sendResponse(true, 'Participant profile created successfully.', ['participant_id' => $participantId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendResponse(false, 'A participant with this name, DOB, and school already exists.');
        }
        sendResponse(false, $e->getMessage());
    }
}
elseif ($action === 'get_schools') {
    $stmt = $pdo->query('SELECT id, name, city, tier FROM schools WHERE is_active = TRUE ORDER BY name ASC');
    $schools = $stmt->fetchAll();
    sendResponse(true, 'Schools loaded', ['schools' => $schools]);
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
