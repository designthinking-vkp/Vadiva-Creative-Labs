<?php
/**
 * Vadiva Tech Fest 3.0 — Velammal Student Database Verification API
 * Vadiva Creative Labs
 *
 * Actions:
 * - GET  ?action=get_campuses     : Returns approved Velammal campus list from DB
 * - POST ?action=verify_student   : Verifies (Campus Name + Admission Number) against Velammal Database
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
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;

function sendApiResponse($success, $message, $data = [], $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Fallback Campuses List (Matches Seed Data exactly)
$DEFAULT_CAMPUSES = [
    ['id' => 1, 'campus_code' => 'VEL-MOG', 'campus_name' => 'Velammal Vidyalaya - Mogappair', 'city' => 'Chennai'],
    ['id' => 2, 'campus_code' => 'VEL-MEL-AYAN', 'campus_name' => 'Velammal Vidyalaya - Mel Ayanambakkam', 'city' => 'Chennai'],
    ['id' => 3, 'campus_code' => 'VEL-PARUTHI', 'campus_name' => 'Velammal Vidyalaya - Paruthipattu', 'city' => 'Chennai'],
    ['id' => 4, 'campus_code' => 'VEL-AVADI', 'campus_name' => 'Velammal Vidyalaya - Avadi', 'city' => 'Chennai'],
    ['id' => 5, 'campus_code' => 'VEL-POONA', 'campus_name' => 'Velammal Vidyalaya - Poonamallee', 'city' => 'Chennai'],
    ['id' => 6, 'campus_code' => 'VEL-KARAM', 'campus_name' => 'Velammal Vidyalaya - Karambakkam', 'city' => 'Chennai'],
    ['id' => 7, 'campus_code' => 'VEL-ALAP', 'campus_name' => 'Velammal Vidyalaya - Alapakkam', 'city' => 'Chennai'],
    ['id' => 8, 'campus_code' => 'VEL-ANNEX', 'campus_name' => 'Velammal Vidyalaya - Annexure', 'city' => 'Chennai'],
    ['id' => 9, 'campus_code' => 'VEL-MADHAV', 'campus_name' => 'Velammal Vidyalaya - Madhavaram', 'city' => 'Chennai'],
    ['id' => 10, 'campus_code' => 'VEL-BODHI-PON', 'campus_name' => 'Velammal Bodhi Campus - Ponneri', 'city' => 'Ponneri'],
    ['id' => 11, 'campus_code' => 'VEL-BODHI-KOL', 'campus_name' => 'Velammal Bodhi Campus - Kolapakkam', 'city' => 'Chennai'],
    ['id' => 12, 'campus_code' => 'VEL-NEWGEN', 'campus_name' => 'Velammal New Gen Edu Network', 'city' => 'Chennai'],
    ['id' => 13, 'campus_code' => 'VEL-MATRIC-MOG', 'campus_name' => 'Velammal Matriculation - Mogappair', 'city' => 'Chennai'],
    ['id' => 14, 'campus_code' => 'VEL-MAIN-MOG', 'campus_name' => 'Velammal Main School - Mogappair', 'city' => 'Chennai']
];

// Fallback Verification Dataset (when MySQL DB tables are initializing)
$FALLBACK_STUDENTS = [
    ['campus_name' => 'Velammal Vidyalaya - Mogappair', 'admission_number' => 'VEL-MOG-1001', 'student_name' => 'Aarav Sharma', 'grade' => 5, 'section' => 'A', 'campus_id' => 1],
    ['campus_name' => 'Velammal Vidyalaya - Mogappair', 'admission_number' => 'VEL-MOG-1002', 'student_name' => 'Diya Ramesh', 'grade' => 8, 'section' => 'B', 'campus_id' => 1],
    ['campus_name' => 'Velammal Vidyalaya - Mogappair', 'admission_number' => 'VEL-MOG-1003', 'student_name' => 'Karthik Raja', 'grade' => 10, 'section' => 'C', 'campus_id' => 1],
    ['campus_name' => 'Velammal Vidyalaya - Mogappair', 'admission_number' => 'MOG202601', 'student_name' => 'Sanjay Kumar', 'grade' => 6, 'section' => 'A', 'campus_id' => 1],
    ['campus_name' => 'Velammal Vidyalaya - Mogappair', 'admission_number' => 'MOG202602', 'student_name' => 'Pooja Sundaram', 'grade' => 9, 'section' => 'B', 'campus_id' => 1],
    ['campus_name' => 'Velammal Vidyalaya - Mel Ayanambakkam', 'admission_number' => 'VEL-MEL-2001', 'student_name' => 'Rithanya Shree', 'grade' => 5, 'section' => 'A', 'campus_id' => 2],
    ['campus_name' => 'Velammal Vidyalaya - Mel Ayanambakkam', 'admission_number' => 'VEL-MEL-2002', 'student_name' => 'Adithya Narayanan', 'grade' => 7, 'section' => 'C', 'campus_id' => 2],
    ['campus_name' => 'Velammal Vidyalaya - Mel Ayanambakkam', 'admission_number' => 'VEL-MEL-2003', 'student_name' => 'Naveen Vignesh', 'grade' => 11, 'section' => 'A', 'campus_id' => 2],
    ['campus_name' => 'Velammal Vidyalaya - Mel Ayanambakkam', 'admission_number' => 'AYAN202601', 'student_name' => 'Harish Balaji', 'grade' => 8, 'section' => 'B', 'campus_id' => 2],
    ['campus_name' => 'Velammal Vidyalaya - Paruthipattu', 'admission_number' => 'VEL-PAR-3001', 'student_name' => 'Meenakshi Iyer', 'grade' => 6, 'section' => 'A', 'campus_id' => 3],
    ['campus_name' => 'Velammal Vidyalaya - Paruthipattu', 'admission_number' => 'VEL-PAR-3002', 'student_name' => 'Vishal Anand', 'grade' => 9, 'section' => 'D', 'campus_id' => 3],
    ['campus_name' => 'Velammal Vidyalaya - Paruthipattu', 'admission_number' => 'PAR202601', 'student_name' => 'Ananya Krishnan', 'grade' => 12, 'section' => 'A', 'campus_id' => 3],
    ['campus_name' => 'Velammal Vidyalaya - Avadi', 'admission_number' => 'VEL-AVD-4001', 'student_name' => 'Saravanan M', 'grade' => 4, 'section' => 'B', 'campus_id' => 4],
    ['campus_name' => 'Velammal Vidyalaya - Avadi', 'admission_number' => 'VEL-AVD-4002', 'student_name' => 'Keerthana R', 'grade' => 8, 'section' => 'A', 'campus_id' => 4],
    ['campus_name' => 'Velammal Vidyalaya - Avadi', 'admission_number' => 'AVD202601', 'student_name' => 'Manoj Kumar', 'grade' => 10, 'section' => 'B', 'campus_id' => 4],
    ['campus_name' => 'Velammal Vidyalaya - Poonamallee', 'admission_number' => 'VEL-POO-5001', 'student_name' => 'Akash Sundar', 'grade' => 5, 'section' => 'C', 'campus_id' => 5],
    ['campus_name' => 'Velammal Vidyalaya - Poonamallee', 'admission_number' => 'VEL-POO-5002', 'student_name' => 'Sneha Lakshmi', 'grade' => 7, 'section' => 'B', 'campus_id' => 5],
    ['campus_name' => 'Velammal Vidyalaya - Karambakkam', 'admission_number' => 'VEL-KAR-6001', 'student_name' => 'Niranjan Swamy', 'grade' => 6, 'section' => 'A', 'campus_id' => 6],
    ['campus_name' => 'Velammal Vidyalaya - Karambakkam', 'admission_number' => 'VEL-KAR-6002', 'student_name' => 'Divya Prakash', 'grade' => 10, 'section' => 'A', 'campus_id' => 6],
    ['campus_name' => 'Velammal Vidyalaya - Alapakkam', 'admission_number' => 'VEL-ALA-7001', 'student_name' => 'Kavitha Nathan', 'grade' => 5, 'section' => 'B', 'campus_id' => 7],
    ['campus_name' => 'Velammal Vidyalaya - Alapakkam', 'admission_number' => 'VEL-ALA-7002', 'student_name' => 'Siddharth V', 'grade' => 8, 'section' => 'A', 'campus_id' => 7],
    ['campus_name' => 'Velammal Vidyalaya - Annexure', 'admission_number' => 'VEL-ANN-8001', 'student_name' => 'Praveen Chandran', 'grade' => 7, 'section' => 'A', 'campus_id' => 8],
    ['campus_name' => 'Velammal Vidyalaya - Annexure', 'admission_number' => 'VEL-ANN-8002', 'student_name' => 'Shreya Mohan', 'grade' => 11, 'section' => 'B', 'campus_id' => 8],
    ['campus_name' => 'Velammal Vidyalaya - Madhavaram', 'admission_number' => 'VEL-MAD-9001', 'student_name' => 'Gowtham Raj', 'grade' => 6, 'section' => 'A', 'campus_id' => 9],
    ['campus_name' => 'Velammal Vidyalaya - Madhavaram', 'admission_number' => 'VEL-MAD-9002', 'student_name' => 'Lavanya S', 'grade' => 9, 'section' => 'C', 'campus_id' => 9],
    ['campus_name' => 'Velammal Bodhi Campus - Ponneri', 'admission_number' => 'BODHI-PON-101', 'student_name' => 'Vikramaditya S', 'grade' => 8, 'section' => 'A', 'campus_id' => 10],
    ['campus_name' => 'Velammal Bodhi Campus - Ponneri', 'admission_number' => 'BODHI-PON-102', 'student_name' => 'Tarun Verma', 'grade' => 11, 'section' => 'A', 'campus_id' => 10],
    ['campus_name' => 'Velammal Bodhi Campus - Kolapakkam', 'admission_number' => 'BODHI-KOL-201', 'student_name' => 'Sai Pranav', 'grade' => 7, 'section' => 'B', 'campus_id' => 11],
    ['campus_name' => 'Velammal Bodhi Campus - Kolapakkam', 'admission_number' => 'BODHI-KOL-202', 'student_name' => 'Swetha Ravichandran', 'grade' => 10, 'section' => 'A', 'campus_id' => 11]
];

// -----------------------------------------------------------------------------
// 1. GET APPROVED VELAMMAL CAMPUSES
// -----------------------------------------------------------------------------
if ($action === 'get_campuses') {
    $campuses = [];
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $stmt = $pdo->query("SELECT id, campus_code, campus_name, city FROM velammal_campuses WHERE is_active = TRUE ORDER BY campus_name ASC");
            $campuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $campuses = $DEFAULT_CAMPUSES;
        }
    }
    if (empty($campuses)) {
        $campuses = $DEFAULT_CAMPUSES;
    }

    sendApiResponse(true, 'Velammal campuses retrieved successfully.', ['campuses' => $campuses]);
}

// -----------------------------------------------------------------------------
// 2. VERIFY VELAMMAL STUDENT (Campus Name + Admission Number)
// -----------------------------------------------------------------------------
elseif ($action === 'verify_student' || $action === 'verify_velammal') {
    $campusName = trim($input['campus_name'] ?? $input['campus'] ?? '');
    $campusId   = (int)($input['campus_id'] ?? 0);
    $admissionNumber = trim($input['admission_number'] ?? $input['admission_no'] ?? $input['adm_no'] ?? '');

    if (empty($campusName) && $campusId > 0) {
        // Resolve campus name from campus ID
        foreach ($DEFAULT_CAMPUSES as $c) {
            if ($c['id'] === $campusId) {
                $campusName = $c['campus_name'];
                break;
            }
        }
    }

    if (empty($campusName) || empty($admissionNumber)) {
        sendApiResponse(false, 'Please check your Admission number and Campus Name.', [
            'is_velammal_student' => false,
            'velammal_verified' => false,
            'tier' => 'OTHER'
        ], 400);
    }

    $matchedStudent = null;

    // 1. Check MySQL velammal_students table
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            // Case-insensitive clean search on campus and admission number
            $stmt = $pdo->prepare("
                SELECT vs.*, vc.id as campus_id, vc.campus_name 
                FROM velammal_students vs
                JOIN velammal_campuses vc ON vs.campus_id = vc.id
                WHERE (LOWER(TRIM(vs.campus_name)) = LOWER(?) OR LOWER(TRIM(vc.campus_name)) = LOWER(?))
                  AND LOWER(TRIM(vs.admission_number)) = LOWER(?)
                  AND vs.is_active = TRUE
                LIMIT 1
            ");
            $stmt->execute([$campusName, $campusName, $admissionNumber]);
            $matchedStudent = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $dbErr) {
            $matchedStudent = null;
        }
    }

    // 2. Fallback to verification table if database not populated yet
    if (!$matchedStudent) {
        $cleanCampus = strtolower(trim($campusName));
        $cleanAdm    = strtolower(trim($admissionNumber));

        foreach ($FALLBACK_STUDENTS as $fs) {
            if ((strtolower(trim($fs['campus_name'])) === $cleanCampus || strpos(strtolower(trim($fs['campus_name'])), $cleanCampus) !== false) 
                && strtolower(trim($fs['admission_number'])) === $cleanAdm) {
                $matchedStudent = $fs;
                break;
            }
        }
    }

    // MATCH FOUND
    if ($matchedStudent) {
        $now = date('Y-m-d H:i:s');
        sendApiResponse(true, 'Velammal Student Verified Successfully.', [
            'is_velammal_student' => true,
            'velammal_verified' => true,
            'tier' => 'VELAMMAL',
            'campus_id' => $matchedStudent['campus_id'] ?? 1,
            'campus_name' => $matchedStudent['campus_name'] ?? $campusName,
            'admission_number' => $matchedStudent['admission_number'] ?? $admissionNumber,
            'student_name' => $matchedStudent['student_name'] ?? '',
            'grade' => (int)($matchedStudent['grade'] ?? 0),
            'section' => $matchedStudent['section'] ?? '',
            'verified_timestamp' => $now
        ]);
    }

    // MATCH NOT FOUND
    sendApiResponse(false, 'Please check your Admission number and Campus Name.', [
        'is_velammal_student' => false,
        'velammal_verified' => false,
        'tier' => 'OTHER'
    ], 200);
}

else {
    sendApiResponse(false, 'Invalid action requested.', [], 404);
}
?>
