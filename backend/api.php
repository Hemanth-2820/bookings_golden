<?php
// CORS headers so React app can communicate across ports/hosts
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
        break;
}

/**
 * Handle Fetching Bookings
 */
function handleGet($pdo) {
    try {
        $date = isset($_GET['date']) ? trim($_GET['date']) : null;
        
        if ($date) {
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE date = ? ORDER BY start_minutes ASC");
            $stmt->execute([$date]);
        } else {
            $stmt = $pdo->query("SELECT * FROM bookings ORDER BY date DESC, start_minutes ASC");
        }

        $rows = $stmt->fetchAll();
        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'name' => $row['name'],
                'mobile' => $row['mobile'],
                'event' => $row['event'],
                'date' => $row['date'],
                'startTime' => $row['start_time'],
                'endTime' => $row['end_time'],
                'startMinutes' => (int)$row['start_minutes'],
                'endMinutes' => (int)$row['end_minutes'],
                'durationMinutes' => (int)$row['duration_minutes'],
                'timeSlot' => $row['time_slot'],
                'cleaningUntil' => $row['cleaning_until'],
                'noOfGuests' => (int)$row['no_of_guests'],
                'addons' => $row['addons'] ? json_decode($row['addons'], true) : [],
                'totalAmount' => (float)$row['total_amount'],
                'advancePaid' => (float)$row['advance_paid'],
                'paymentStatus' => $row['payment_status'],
                'paymentMethod' => $row['payment_method'],
                'notes' => $row['notes'],
                'createdAt' => $row['created_at']
            ];
        }, $rows);

        echo json_encode([
            'success' => true,
            'count' => count($formatted),
            'data' => $formatted
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/**
 * Handle Creating or Updating a Booking (Save)
 */
function handlePost($pdo) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        return;
    }

    $id = !empty($data['id']) ? (string)$data['id'] : (string)time();
    $name = trim($data['name'] ?? '');
    $mobile = trim($data['mobile'] ?? '');
    $event = trim($data['event'] ?? 'Birthday Party');
    $date = trim($data['date'] ?? '');
    $startTime = trim($data['startTime'] ?? '10:00');
    $endTime = trim($data['endTime'] ?? '12:00');
    $startMinutes = (int)($data['startMinutes'] ?? 600);
    $endMinutes = (int)($data['endMinutes'] ?? 720);
    $durationMinutes = (int)($data['durationMinutes'] ?? 120);
    $timeSlot = trim($data['timeSlot'] ?? '');
    $cleaningUntil = trim($data['cleaningUntil'] ?? '');
    $noOfGuests = (int)($data['noOfGuests'] ?? 1);
    $addonsJson = json_encode($data['addons'] ?? []);
    $totalAmount = (float)($data['totalAmount'] ?? 0);
    $advancePaid = (float)($data['advancePaid'] ?? 0);
    $paymentStatus = trim($data['paymentStatus'] ?? 'Pending');
    $paymentMethod = trim($data['paymentMethod'] ?? 'UPI / GPay');
    $notes = trim($data['notes'] ?? '');

    if (empty($name) || empty($mobile) || empty($date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Name, mobile and date are required']);
        return;
    }

    // Backend Conflict & 30-Minute Cleaning Buffer Validation:
    // Check if slot overlaps with existing bookings on the same date (excluding current booking ID)
    $cleanGap = 30;
    $proposedBlockedEnd = $endMinutes + $cleanGap;

    $stmtCheck = $pdo->prepare("SELECT id, name, time_slot, start_minutes, end_minutes FROM bookings WHERE date = ? AND id != ?");
    $stmtCheck->execute([$date, $id]);
    $existing = $stmtCheck->fetchAll();

    foreach ($existing as $ex) {
        $exStart = (int)$ex['start_minutes'];
        $exBlockedEnd = (int)$ex['end_minutes'] + $cleanGap;

        if ($startMinutes < $exBlockedEnd && $exStart < $proposedBlockedEnd) {
            http_response_code(409); // Conflict
            echo json_encode([
                'success' => false,
                'error' => "Slot conflict: overlaps with booking for {$ex['name']} ({$ex['time_slot']}) or its 30-minute cleaning gap."
            ]);
            return;
        }
    }

    try {
        $sql = "INSERT INTO bookings (
                    id, name, mobile, event, date, start_time, end_time, start_minutes, end_minutes, 
                    duration_minutes, time_slot, cleaning_until, no_of_guests, addons, 
                    total_amount, advance_paid, payment_status, payment_method, notes
                ) VALUES (
                    :id, :name, :mobile, :event, :date, :start_time, :end_time, :start_minutes, :end_minutes, 
                    :duration_minutes, :time_slot, :cleaning_until, :no_of_guests, :addons, 
                    :total_amount, :advance_paid, :payment_status, :payment_method, :notes
                ) ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    mobile = VALUES(mobile),
                    event = VALUES(event),
                    date = VALUES(date),
                    start_time = VALUES(start_time),
                    end_time = VALUES(end_time),
                    start_minutes = VALUES(start_minutes),
                    end_minutes = VALUES(end_minutes),
                    duration_minutes = VALUES(duration_minutes),
                    time_slot = VALUES(time_slot),
                    cleaning_until = VALUES(cleaning_until),
                    no_of_guests = VALUES(no_of_guests),
                    addons = VALUES(addons),
                    total_amount = VALUES(total_amount),
                    advance_paid = VALUES(advance_paid),
                    payment_status = VALUES(payment_status),
                    payment_method = VALUES(payment_method),
                    notes = VALUES(notes)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':mobile' => $mobile,
            ':event' => $event,
            ':date' => $date,
            ':start_time' => $startTime,
            ':end_time' => $endTime,
            ':start_minutes' => $startMinutes,
            ':end_minutes' => $endMinutes,
            ':duration_minutes' => $durationMinutes,
            ':time_slot' => $timeSlot,
            ':cleaning_until' => $cleaningUntil,
            ':no_of_guests' => $noOfGuests,
            ':addons' => $addonsJson,
            ':total_amount' => $totalAmount,
            ':advance_paid' => $advancePaid,
            ':payment_status' => $paymentStatus,
            ':payment_method' => $paymentMethod,
            ':notes' => $notes
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Booking saved successfully',
            'bookingId' => $id
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/**
 * Handle Deleting a Booking
 */
function handleDelete($pdo) {
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;
    
    if (!$id) {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $id = $data['id'] ?? null;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Booking ID is required']);
        return;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => "Booking #$id deleted successfully"
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
