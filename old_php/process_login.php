<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: login.php');
    exit();
}

// Get and sanitize input
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
$password = $_POST['password'];
$remember = isset($_POST['remember']) ? true : false;

// Validation
if (empty($email) || empty($password)) {
    $_SESSION['error'] = "Email and password are required";
    header('Location: login.php');
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['error'] = "Invalid email format";
    header('Location: login.php');
    exit();
}

try {
    $conn = getDBConnection();

    // Get user from database
    $stmt = $conn->prepare("
        SELECT id, fullname, email, password, user_type, status
        FROM users
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $_SESSION['error'] = "Invalid email or password";
        header('Location: login.php');
        exit();
    }

    // Check if account is active
    if ($user['status'] !== 'active') {
        $_SESSION['error'] = "Your account is not active. Please contact support.";
        header('Location: login.php');
        exit();
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        $_SESSION['error'] = "Invalid email or password";
        header('Location: login.php');
        exit();
    }

    // Login successful
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['fullname'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_type'] = $user['user_type'];
    $_SESSION['logged_in'] = true;

    // Update last login
    $update_stmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $update_stmt->execute([$user['id']]);

    // Handle remember me
    if ($remember) {
        $token = generateToken();
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));

        $session_stmt = $conn->prepare("
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (?, ?, ?)
        ");
        $session_stmt->execute([$user['id'], $token, $expires]);

        // Set cookie for 30 days
        setcookie('remember_token', $token, time() + (30 * 24 * 60 * 60), '/');
    }

    // Log the activity
    $ip = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'];

    $log_stmt = $conn->prepare("
        INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
        VALUES (?, 'login', ?, ?)
    ");
    $log_stmt->execute([$user['id'], $ip, $user_agent]);

    // Redirect to dashboard
    header('Location: dashboard.php');
    exit();

} catch(Exception $e) {
    $_SESSION['error'] = "An error occurred. Please try again later.";
    header('Location: login.php');
    exit();
}
?>