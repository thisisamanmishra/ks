<?php
// Database Configuration for KaryaSaarthi
// REPLACE config.php with this after creating database

define('DB_HOST', 'localhost');
define('DB_NAME', 'u541656631_karyasaarthi'); // Your actual database from Hostinger
define('DB_USER', 'u541656631_ksadmin');      // Your actual username from Hostinger
define('DB_PASS', 'YourActualPassword');       // Your actual password you created

// Site Configuration (Don't change these)
define('SITE_NAME', 'KaryaSaarthi');
define('SITE_URL', 'https://karyasaarthi.com');
define('SITE_EMAIL', 'info.karyasaarthi@gmail.com');

// Security Configuration
define('SECURE_AUTH_KEY', 'ks2024securekeyhash');
define('SESSION_LIFETIME', 3600);

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Connection
function getDBConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $conn;
    } catch(PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
}

// Security Functions
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header("Location: login.php");
        exit();
    }
}

function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}
?>