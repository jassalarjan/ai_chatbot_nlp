<?php
$host = "localhost";
$user = "login_system";  // Change to your database username
$pass = "lg@sys";      // Change to your database password
$dbname = "login_system";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
    echo "error";
}
?>
