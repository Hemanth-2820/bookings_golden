# Step-by-Step Guide: Deploying to BigRock cPanel

Your project is completely built, tested, and ready to upload to BigRock cPanel!

---

## What to Upload (Directory Map)

In your BigRock cPanel **File Manager** under `public_html/` (or your subdomain folder), you will upload two things:

```text
public_html/
│
├── index.html           <-- From your local "dist/index.html"
├── assets/              <-- From your local "dist/assets/"
│   ├── index-*.js
│   └── index-*.css
├── .htaccess            <-- From your local "dist/.htaccess" (Enables React SPA routing)
│
└── backend/             <-- Upload your local "backend/" folder
    ├── api.php
    ├── config.php
    ├── schema.sql
    └── README.md
```

---

## Step 1: Create MySQL Database in BigRock cPanel
1. Log in to your **BigRock cPanel**.
2. Go to **MySQL Databases** (or **MySQL Database Wizard**).
3. Create a new database:
   - Example name: `yourcpaneluser_bookings_db`
4. Create a new MySQL user:
   - Example user: `yourcpaneluser_dbuser`
   - Set a strong password (e.g. `SecretPassword@123`).
5. **Add User to Database**:
   - Check the box **ALL PRIVILEGES** and click **Make Changes**.

---

## Step 2: Import the Database Schema in phpMyAdmin
1. In cPanel, open **phpMyAdmin**.
2. Select your newly created database on the left sidebar.
3. Click the **Import** tab at the top.
4. Choose the file `backend/schema.sql` from your project and click **Go** (or **Import**).
   - This creates the `bookings` table with all fields and initial test data.

---

## Step 3: Update `backend/config.php` with Your Database Credentials
Open or edit `backend/config.php` (you can do this directly in cPanel File Manager Code Editor):

```php
<?php
// BigRock cPanel Database configuration
$host = '127.0.0.1'; // or 'localhost'
$port = '3306';
$dbname = 'yourcpaneluser_bookings_db'; // Your cPanel database name
$user = 'yourcpaneluser_dbuser';        // Your cPanel MySQL username
$password = 'SecretPassword@123';        // Your cPanel MySQL password
```

---

## Step 4: Upload the Frontend Files
1. Open cPanel **File Manager** and navigate into `public_html/`.
2. Upload the contents of your local `dist/` directory:
   - `dist/index.html`
   - `dist/assets/` (the entire folder containing CSS & JS)
   - `dist/.htaccess` (Ensure "Show Hidden Files" is enabled in cPanel settings so `.htaccess` is visible).
3. Upload the `backend/` directory directly into `public_html/backend/`.

---

## Step 5: Test Your Live Site
1. Open your domain (e.g. `https://yourdomain.com`).
2. Test the Calendar, Bookings Table, Form Management, and Accounting views.
3. Click **"New Booking (Call)"**, enter a test customer, select add-ons, and click **Confirm Booking**:
   - It will save permanently to your MySQL database.
   - It will automatically launch the WhatsApp booking confirmation to the registered number.
