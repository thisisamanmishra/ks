<?php
session_start();

// Clear all session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// Clear remember me cookie if exists
if(isset($_COOKIE['remember_token'])) {
    setcookie('remember_token', '', time() - 3600, '/');
}

// Redirect to login page with success message
session_start();
$_SESSION['success'] = "You have been successfully logged out.";
header('Location: login.php');
exit();
?>