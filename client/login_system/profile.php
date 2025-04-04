<?php
session_start();

// Redirect to login if session is not set
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

// Get user data from session
$user = $_SESSION['user'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Source Code Pro", monospace;
        }

        body {
            background: linear-gradient(-45deg, #4481eb, #04befe);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
        }

        .profile-container {
            width: 90%;
            max-width: 400px;
            background: white;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
        }

        .profile-container img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin-bottom: 10px;
            border: 3px solid #4481eb;
        }

        .profile-container h2 {
            color: #333;
            margin-bottom: 10px;
        }

        .profile-container p {
            color: gray;
            font-size: 16px;
            margin-bottom: 20px;
        }

        .btn {
            background: #4481eb;
            border: none;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: background 0.3s;
        }

        .btn:hover {
            background: #04befe;
        }
    </style>
</head>
<body>

<div class="profile-container">
    <img src="<?= htmlspecialchars($user['picture']) ?>" alt="User Image">
    <h2><?= htmlspecialchars($user['name']) ?></h2>
    <p><?= htmlspecialchars($user['email']) ?></p>
    <a href="dashboard.php" class="btn"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
    <a href="logout.php" class="btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
</div>

</body>
</html>
