<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sendResponse($success, $message, $data = []) {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

// Helper to determine band ranking
function getBandRank($band) {
    if ($band === 'JUNIOR') return 1;
    if ($band === 'INTERMEDIATE') return 2;
    return 3;
}

if ($action === 'create_team') {
    $competitionId = $input['competition_id'] ?? 0;
    $teamName = $input['team_name'] ?? '';
    $leaderParticipantId = $input['leader_participant_id'] ?? 0;

    if (!$competitionId || empty($teamName) || !$leaderParticipantId) {
        sendResponse(false, 'Missing required fields.');
    }

    try {
        $pdo->beginTransaction();

        // Validate Leader
        $stmt = $pdo->prepare('SELECT entry_status, band, tier, full_name, grade FROM participants WHERE id = ?');
        $stmt->execute([$leaderParticipantId]);
        $leader = $stmt->fetch();

        if (!$leader || $leader['entry_status'] !== 'PAID') {
            throw new Exception($leader['full_name'] . ' has not paid the festival entry fee yet, so they cannot join a team.');
        }

        // Check if already in a team for this competition
        $stmt = $pdo->prepare('
            SELECT t.name FROM team_members tm 
            JOIN teams t ON tm.team_id = t.id 
            WHERE tm.participant_id = ? AND t.competition_id = ?
        ');
        $stmt->execute([$leaderParticipantId, $competitionId]);
        $existingTeam = $stmt->fetch();

        if ($existingTeam) {
            throw new Exception($leader['full_name'] . ' is already in ' . $existingTeam['name'] . ' for this competition. A student can enter each competition once.');
        }

        // Fetch Competition
        $stmt = $pdo->prepare('SELECT name, min_team_size FROM competitions WHERE id = ?');
        $stmt->execute([$competitionId]);
        $competition = $stmt->fetch();

        if (!$competition) {
            throw new Exception('Invalid competition.');
        }

        // Insert Team
        $stmt = $pdo->prepare('
            INSERT INTO teams (competition_id, name, leader_participant_id, derived_band, derived_tier, roster_lock_date)
            VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
        ');
        $stmt->execute([$competitionId, $teamName, $leaderParticipantId, $leader['band'], $leader['tier']]);
        $teamId = $pdo->lastInsertId();

        // Insert Leader as Member
        $stmt = $pdo->prepare('INSERT INTO team_members (team_id, participant_id, role) VALUES (?, ?, "LEADER")');
        $stmt->execute([$teamId, $leaderParticipantId]);

        $pdo->commit();
        sendResponse(true, 'Team created successfully.', ['team_id' => $teamId]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
elseif ($action === 'add_member') {
    $teamId = $input['team_id'] ?? 0;
    $participantId = $input['participant_id'] ?? 0;
    $role = $input['role'] ?? 'MEMBER'; // MEMBER or RESERVE
    $confirmBandChange = $input['confirm_band_change'] ?? false;

    if (!$teamId || !$participantId) {
        sendResponse(false, 'Team ID and Participant ID are required.');
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT * FROM teams WHERE id = ? FOR UPDATE');
        $stmt->execute([$teamId]);
        $team = $stmt->fetch();

        if (!$team) {
            throw new Exception('Team not found.');
        }
        
        if ($team['status'] === 'PAID') {
            throw new Exception('Cannot add members to a paid team (unless handled via admin override).');
        }

        $stmt = $pdo->prepare('SELECT entry_status, band, tier, full_name, grade FROM participants WHERE id = ?');
        $stmt->execute([$participantId]);
        $member = $stmt->fetch();

        if (!$member || $member['entry_status'] !== 'PAID') {
            throw new Exception(($member['full_name'] ?? 'Student') . ' has not paid the festival entry fee yet, so they cannot join a team.');
        }

        // Check if already in this competition
        $stmt = $pdo->prepare('
            SELECT t.name FROM team_members tm 
            JOIN teams t ON tm.team_id = t.id 
            WHERE tm.participant_id = ? AND t.competition_id = ?
        ');
        $stmt->execute([$participantId, $team['competition_id']]);
        $existingTeam = $stmt->fetch();

        if ($existingTeam) {
            throw new Exception($member['full_name'] . ' is already in ' . $existingTeam['name'] . ' for this competition. A student can enter each competition once.');
        }

        // Check Band Change
        $newBand = $team['derived_band'];
        if (getBandRank($member['band']) > getBandRank($team['derived_band'])) {
            $newBand = $member['band'];
            if (!$confirmBandChange) {
                // Return warning asking for confirmation
                $pdo->rollBack();
                sendResponse(false, 'Adding ' . $member['full_name'] . ' from Grade ' . $member['grade'] . ' moves this team to ' . $newBand . '. Continue?', ['requires_confirmation' => true]);
            }
        }

        // Check Tier Change
        $newTier = $team['derived_tier'];
        if ($member['tier'] === 'OTHER') {
            $newTier = 'OTHER';
        }

        // Add member
        $stmt = $pdo->prepare('INSERT INTO team_members (team_id, participant_id, role) VALUES (?, ?, ?)');
        $stmt->execute([$teamId, $participantId, $role]);

        // Update Team Derivations
        $stmt = $pdo->prepare('UPDATE teams SET derived_band = ?, derived_tier = ? WHERE id = ?');
        $stmt->execute([$newBand, $newTier, $teamId]);

        $pdo->commit();
        sendResponse(true, 'Member added to team.');

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, $e->getMessage());
    }
}
else {
    sendResponse(false, 'Invalid action.');
}
?>
