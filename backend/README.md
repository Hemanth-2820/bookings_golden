# PHP + MySQL Backend Setup Guide

The PHP backend files are located inside the `backend/` directory:

1. [schema.sql](file:///c:/Users/DELL/Documents/bookings_golden/backend/schema.sql) - Database table creation and seed data.
2. [config.php](file:///c:/Users/DELL/Documents/bookings_golden/backend/config.php) - MySQL connection settings.
3. [api.php](file:///c:/Users/DELL/Documents/bookings_golden/backend/api.php) - REST API with slot conflict & cleaning buffer validation.

---

## Quick Setup Steps (XAMPP / WAMP / Apache)

### Step 1: Create Database in phpMyAdmin / MySQL
1. Open **phpMyAdmin** (usually `http://localhost/phpmyadmin`).
2. Go to the **Import** tab or open SQL query editor.
3. Import the file [backend/schema.sql](file:///c:/Users/DELL/Documents/bookings_golden/backend/schema.sql) (or copy-paste its contents and click **Go**).
   - This creates `bookings_golden_db` database and the `bookings` table.

---

### Step 2: Configure Database Credentials
Open [backend/config.php](file:///c:/Users/DELL/Documents/bookings_golden/backend/config.php) and verify your MySQL details:
```php
$host = '127.0.0.1';
$dbname = 'bookings_golden_db';
$user = 'root';        // Your MySQL username
$password = '';        // Your MySQL password
```

---

### Step 3: Run the PHP Backend Server
You can either place the `backend/` folder into your `htdocs` (XAMPP) or run PHP's built-in server directly from the terminal:

```bash
cd c:\Users\DELL\Documents\bookings_golden\backend
php -S localhost:8000
```

---

## Dual Sync Mode:
- **When PHP is running**: Bookings are saved directly to MySQL and synced across any admin device connecting to the server.
- **When offline / PHP not running**: The app continues to work smoothly using browser storage (`localStorage`), so booking is never interrupted.
