<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
include 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    if (empty($email) || empty($password)) {
        die("Email and password are required.");
    }

    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("s", $email);
    if (!$stmt->execute()) {
        die("Execute failed: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user) {
        if (password_verify($password, $user['password'])) {
            session_start();
            $_SESSION['user'] = $user['username'];
            echo "success";
        } else {
            echo "Invalid password";
        }
    } else {
        echo "User not found";
    }

    $stmt->close();
    $conn->close();
} else {
    die("Invalid request method");
}
?>
