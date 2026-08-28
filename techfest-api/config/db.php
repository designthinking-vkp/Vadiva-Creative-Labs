<?php
// techfest-api/config/db.php
\System.Management.Automation.Internal.Host.InternalHost = getenv('DB_HOST') ?: 'localhost';
\   = getenv('DB_DATABASE') ?: 'techfest_db';
\ = getenv('DB_USERNAME') ?: 'root';
\ = getenv('DB_PASSWORD') ?: '';
\ = 'utf8mb4';

\ = "mysql:host=\System.Management.Automation.Internal.Host.InternalHost;dbname=\;charset=\";
\ = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    \ = new PDO(\, \, \, \);
} catch (\PDOException \) {
    // DO NOT echo the error in production
    throw new \PDOException(\->getMessage(), (int)\->getCode());
}
?>
