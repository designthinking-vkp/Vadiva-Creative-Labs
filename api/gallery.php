<?php
/**
 * Vadiva Creative Labs - Gallery API Endpoint
 * Handles media uploads, database persistence, and REST endpoints for PHP production servers.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/gallery_data.json';
$uploadsDir = __DIR__ . '/../assets/uploads/';

if (!file_exists($uploadsDir)) {
    @mkdir($uploadsDir, 0755, true);
}

// Basic action router
$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

switch ($action) {
    case 'upload':
        handleUpload($uploadsDir);
        break;

    case 'status':
    default:
        echo json_encode([
            'status' => 'online',
            'service' => 'Vadiva Gallery API',
            'version' => '2.0.0',
            'timestamp' => date('c'),
            'upload_directory_writable' => is_writable($uploadsDir)
        ]);
        break;
}

function handleUpload($targetDir) {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No file received or file upload error (code: ' . ($_FILES['file']['error'] ?? 'missing') . ')'
        ]);
        return;
    }

    $file = $_FILES['file'];
    $allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm'
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedMimes)) {
        http_response_code(415);
        echo json_encode([
            'success' => false,
            'message' => 'Unsupported file type: ' . $mimeType . '. Allowed: JPEG, PNG, WEBP, GIF, MP4, WEBM'
        ]);
        return;
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = 'vcl_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = $targetDir . $safeName;

    if (move_uploaded_file($file['tmp_name'], $destPath)) {
        $relativeUrl = 'assets/uploads/' . $safeName;
        $isPhoto = strpos($mimeType, 'image/') === 0;

        echo json_encode([
            'success' => true,
            'fileUrl' => $relativeUrl,
            'thumbnailUrl' => $relativeUrl,
            'type' => $isPhoto ? 'photo' : 'video',
            'originalName' => $file['name'],
            'size' => $file['size'],
            'mimeType' => $mimeType
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save uploaded file to disk'
        ]);
    }
}
