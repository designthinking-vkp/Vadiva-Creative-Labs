<?php
// techfest-api/config/db.php
require_once __DIR__ . '/env.php';

$host = defined('DB_HOST') ? DB_HOST : (getenv('DB_HOST') ?: 'localhost');
$port = defined('DB_PORT') ? DB_PORT : (getenv('DB_PORT') ?: '3306');
$db   = defined('DB_DATABASE') ? DB_DATABASE : (getenv('DB_DATABASE') ?: 'techfest_db');
$user = defined('DB_USERNAME') ? DB_USERNAME : (getenv('DB_USERNAME') ?: 'root');
$pass = defined('DB_PASSWORD') ? DB_PASSWORD : (getenv('DB_PASSWORD') ?: '');
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
];

$pdo = null;

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Auto-create any missing tables & seed data seamlessly
    require_once __DIR__ . '/schema_init.php';
    ensureSchemaTables($pdo);

} catch (\PDOException $e) {
    // Log error securely without exposing DB credentials
    error_log("Database connection failed: " . $e->getMessage());
    $pdo = null;
}
?>
