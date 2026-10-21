-- Database Table for Admin Bookings Portal
-- Compatible with cPanel phpMyAdmin

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

-- Admin Security & Settings Table
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `setting_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `setting_val` VARCHAR(255) NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert or update default admin password
INSERT INTO `admin_settings` (`setting_key`, `setting_val`) 
VALUES ('admin_password', 'bookinggolden2026')
ON DUPLICATE KEY UPDATE `setting_val` = VALUES(`setting_val`);

