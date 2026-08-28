<?php
// techfest-api/clash.php
require_once __DIR__ . '/config/db.php';

function detectClash($pdo, $participantId, $newStart, $newEnd, $newItemName) {
    // Buffer is 15 minutes
    $newStartTime = strtotime($newStart);
    $newEndTime = strtotime($newEnd);

    // Fetch all existing commitments for this participant
    // 1. Workshop Bookings
    $stmt = $pdo->prepare('
        SELECT w.name as item_name, s.starts_at, s.ends_at
        FROM bookings b
        JOIN batches ba ON b.batch_id = ba.id
        JOIN workshops w ON ba.workshop_id = w.id
        JOIN sessions s ON s.batch_id = ba.id
        WHERE b.participant_id = ? AND b.status IN ("CONFIRMED", "SOFT_LOCK")
    ');
    $stmt->execute([$participantId]);
    $workshopBookings = $stmt->fetchAll();

    // 2. Competition Entries (via team or individual)
    $stmt = $pdo->prepare('
        SELECT c.name as item_name, cw.starts_at, cw.ends_at
        FROM competition_entries ce
        JOIN competition_windows cw ON ce.competition_window_id = cw.id
        JOIN competitions c ON cw.competition_id = c.id
        LEFT JOIN team_members tm ON ce.team_id = tm.team_id
        WHERE (ce.participant_id = ? OR tm.participant_id = ?) AND ce.status = "CONFIRMED"
    ');
    $stmt->execute([$participantId, $participantId]);
    $competitionBookings = $stmt->fetchAll();

    $allBookings = array_merge($workshopBookings, $competitionBookings);

    foreach ($allBookings as $booking) {
        $existingStart = strtotime($booking['starts_at']);
        $existingEnd = strtotime($booking['ends_at']);

        // Check for direct overlap
        if ($newStartTime < $existingEnd && $newEndTime > $existingStart) {
            return generateClashMessage($booking['item_name'], $booking['starts_at']);
        }

        // Check buffer (15 mins)
        // If new session is after existing session, diff between new start and existing end must be >= 15 min
        if ($newStartTime >= $existingEnd) {
            $gap = ($newStartTime - $existingEnd) / 60;
            if ($gap < 15) {
                return generateClashMessage($booking['item_name'], $booking['starts_at']);
            }
        }
        
        // If new session is before existing session, diff between existing start and new end must be >= 15 min
        if ($existingStart >= $newEndTime) {
            $gap = ($existingStart - $newEndTime) / 60;
            if ($gap < 15) {
                return generateClashMessage($booking['item_name'], $booking['starts_at']);
            }
        }
    }

    return null; // No clash
}

function generateClashMessage($itemName, $startTimeStr) {
    $day = date('l, M j', strtotime($startTimeStr));
    $time = date('h:i A', strtotime($startTimeStr));
    return "This clashes with $itemName on $day at $time. Cancel that first, or choose another batch.";
}
?>
