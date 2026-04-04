<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: signup.php');
    exit();
}

// Get and sanitize input
$fullname = sanitizeInput($_POST['fullname']);
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
$phone = sanitizeInput($_POST['phone']);
$password = $_POST['password'];
$confirm_password = $_POST['confirm_password'];
$user_type = sanitizeInput($_POST['user_type']);

// Validation
$errors = [];

if (empty($fullname) || empty($email) || empty($phone) || empty($password) || empty($user_type)) {
    $errors[] = "All fields are required";
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email format";
}

if (strlen($password) < 6) {
    $errors[] = "Password must be at least 6 characters";
}

if ($password !== $confirm_password) {
    $errors[] = "Passwords do not match";
}

if (!preg_match('/^[0-9]{10}$/', $phone)) {
    $errors[] = "Invalid phone number format";
}

// Check for errors
if (!empty($errors)) {
    $_SESSION['error'] = implode('<br>', $errors);
    header('Location: signup.php');
    exit();
}

try {
    $conn = getDBConnection();

    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        $_SESSION['error'] = "Email already registered. Please login.";
        header('Location: signup.php');
        exit();
    }

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $conn->prepare("
        INSERT INTO users (fullname, email, phone, password, user_type)
        VALUES (?, ?, ?, ?, ?)
    ");

    if ($stmt->execute([$fullname, $email, $phone, $hashed_password, $user_type])) {
        $_SESSION['success'] = "Account created successfully! Please login.";

        // Log the activity
        $user_id = $conn->lastInsertId();
        $ip = $_SERVER['REMOTE_ADDR'];
        $user_agent = $_SERVER['HTTP_USER_AGENT'];

        $log_stmt = $conn->prepare("
            INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
            VALUES (?, 'signup', ?, ?)
        ");
        $log_stmt->execute([$user_id, $ip, $user_agent]);

        header('Location: login.php');
    } else {
        $_SESSION['error'] = "Registration failed. Please try again.";
        header('Location: signup.php');
    }

} catch(Exception $e) {
    $_SESSION['error'] = "An error occurred. Please try again later.";
    header('Location: signup.php');
}
?>