<?php
// This script should be invoked via Hostinger Cron Jobs (e.g., every 1 minute)
require_once __DIR__ . '/config/db.php';

try {
    $pdo->beginTransaction();

    // 1. Release expired soft locks
    $stmt = $pdo->prepare('
        UPDATE batches b
        JOIN bookings bo ON b.id = bo.batch_id
        SET b.seats_taken = IF(b.seats_taken > 0, b.seats_taken - 1, 0)
        WHERE bo.status = "SOFT_LOCK" AND bo.locked_until < NOW()
    ');
    $stmt->execute();

    $stmt = $pdo->prepare('DELETE FROM bookings WHERE status = "SOFT_LOCK" AND locked_until < NOW()');
    $stmt->execute();

    // 2. Process waitlist offers
    // Find batches with available capacity where waitlist exists
    $stmt = $pdo->prepare('
        SELECT b.id, b.capacity, b.seats_taken, 
        (SELECT COUNT(*) FROM bookings WHERE batch_id = b.id AND status = "SOFT_LOCK" AND locked_until > NOW()) as locked_seats
        FROM batches b
    ');
    $stmt->execute();
    $batches = $stmt->fetchAll();

    foreach ($batches as $batch) {
        $available = $batch['capacity'] - $batch['seats_taken'] - $batch['locked_seats'];
        if ($available > 0) {
            // Fetch top N waitlisted participants
            $waitlistStmt = $pdo->prepare('
                SELECT id, participant_id FROM waitlists 
                WHERE batch_id = ? AND state = "WAITING" 
                ORDER BY position ASC LIMIT ?
            ');
            $waitlistStmt->bindParam(1, $batch['id'], PDO::PARAM_INT);
            $waitlistStmt->bindParam(2, $available, PDO::PARAM_INT);
            $waitlistStmt->execute();
            $candidates = $waitlistStmt->fetchAll();

            foreach ($candidates as $candidate) {
                // Issue offer (Valid for 12 hours)
                $offerStmt = $pdo->prepare('
                    UPDATE waitlists 
                    SET state = "OFFERED", offered_at = NOW(), offer_expires_at = DATE_ADD(NOW(), INTERVAL 12 HOUR)
                    WHERE id = ?
                ');
                $offerStmt->execute([$candidate['id']]);

                // TODO: Insert into notifications table to send SMS/Email
            }
        }
    }

    // 3. Expire unaccepted waitlist offers
    $stmt = $pdo->prepare('UPDATE waitlists SET state = "EXPIRED" WHERE state = "OFFERED" AND offer_expires_at < NOW()');
    $stmt->execute();

    $pdo->commit();
    echo "Cron completed successfully.\n";
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Cron Error: " . $e->getMessage());
    echo "Cron failed.\n";
}
?>
