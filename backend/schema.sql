-- Database Schema for Admin Bookings Portal
-- Compatible with MySQL / MariaDB (XAMPP / WAMP / cPanel / Docker)

CREATE DATABASE IF NOT EXISTS `bookings_golden_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `bookings_golden_db`;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(25) NOT NULL,
  `event` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `start_minutes` INT NOT NULL,
  `end_minutes` INT NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 120,
  `time_slot` VARCHAR(100) NOT NULL,
  `cleaning_until` VARCHAR(20) DEFAULT NULL,
  `no_of_guests` INT NOT NULL DEFAULT 1,
  `addons` JSON DEFAULT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `advance_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `payment_method` VARCHAR(50) DEFAULT 'UPI / GPay',
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (`date`),
  INDEX idx_mobile (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional initial seed bookings matching default October 2026 data
INSERT INTO `bookings` (`id`, `name`, `mobile`, `event`, `date`, `start_time`, `end_time`, `start_minutes`, `end_minutes`, `duration_minutes`, `time_slot`, `cleaning_until`, `no_of_guests`, `addons`, `total_amount`, `advance_paid`, `payment_status`, `payment_method`, `notes`)
VALUES
('01', 'Rahul Sharma', '9876543210', 'Birthday Party', '2026-10-13', '10:00', '12:00', 600, 720, 120, '10:00 AM - 12:00 PM (2 hrs)', '12:30 PM', 15, '[{"id":"venue","name":"Venue","price":999},{"id":"fog","name":"Fog","price":900},{"id":"led_number","name":"Led number","price":300,"quantity":2},{"id":"cake","name":"Cake","price":1200,"detail":"1.5kg Chocolate Truffle"}]', 3399.00, 1500.00, 'Advance Paid', 'UPI / GPay', 'Cake arrival expected around 10:30 AM'),
('02', 'Pooja Hegde', '9988776655', 'Couple Surprise', '2026-10-13', '13:00', '14:30', 780, 870, 90, '01:00 PM - 02:30 PM (1.5 hrs)', '03:00 PM', 2, '[{"id":"venue","name":"Venue","price":999},{"id":"candle","name":"Candle","price":300},{"id":"petals","name":"Petals","price":350},{"id":"message_box","name":"Message box","price":100},{"id":"bouquet","name":"Bouquet","price":800,"detail":"Red Roses & Orchids"}]', 2549.00, 2549.00, 'Completed', 'Cash', 'Dim romantic warm lights requested'),
('03', 'Kavita Rao', '9811223344', 'Anniversary', '2026-10-13', '15:30', '17:30', 930, 1050, 120, '03:30 PM - 05:30 PM (2 hrs)', '06:00 PM', 6, '[{"id":"venue","name":"Venue","price":999},{"id":"photo_video","name":"Photo / video","price":1500},{"id":"cake","name":"Cake","price":950,"detail":"Red Velvet"}]', 3449.00, 2000.00, 'Advance Paid', 'UPI / PhonePe', 'Day 13 is fully booked (No slots available)'),
('04', 'Anand Verma', '9123456789', 'Anniversary', '2026-10-14', '19:00', '21:00', 1140, 1260, 120, '07:00 PM - 09:00 PM (2 hrs)', '09:30 PM', 6, '[{"id":"venue","name":"Venue","price":999},{"id":"photo_video","name":"Photo / video","price":1500},{"id":"cake","name":"Cake","price":950,"detail":"Red Velvet"}]', 3449.00, 1000.00, 'Advance Paid', 'Card', '10th wedding anniversary')
ON DUPLICATE KEY UPDATE `id`=`id`;
