<?php
// Database configuration for HostGator / cPanel
$dbname = 'nsgsowg8_golden_bookings';
$user = 'nsgsowg8_golden';
$password = 'bookinggolden2026';

try {
    // Primary: Standard cPanel localhost connection via Unix socket
    $pdo = new PDO("mysql:host=localhost;dbname=$dbname;charset=utf8mb4", $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    try {
        // Fallback: 127.0.0.1 TCP loopback
        $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=$dbname;charset=utf8mb4", $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e2) {
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed: ' . $e->getMessage()
        ]);
        exit;
    }
}
