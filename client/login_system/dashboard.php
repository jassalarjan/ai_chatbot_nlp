<?php
session_start();

// Redirect to login if session is not set
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

// Retrieve user data
$user = $_SESSION['user'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
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

        .dashboard-container {
            width: 90%;
            max-width: 1200px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
        }

        .sidebar {
            width: 250px;
            background: #4481eb;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .sidebar h2 {
            color: white;
            margin-bottom: 20px;
        }

        .sidebar a {
            text-decoration: none;
            color: white;
            padding: 10px;
            display: block;
            width: 100%;
            text-align: center;
            border-radius: 5px;
            margin: 5px 0;
            transition: background 0.3s;
        }

        .sidebar a:hover {
            background: #04befe;
        }

        .content {
            flex: 1;
            padding: 30px;
            background: #f4f4f4;
            color: #333;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .header .user-info {
            display: flex;
            align-items: center;
        }

        .user-info img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-right: 10px;
        }

        .logout-btn {
            background: #4481eb;
            border: none;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .logout-btn:hover {
            background: #04befe;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .card i {
            font-size: 40px;
            color: #4481eb;
        }

        .card h3 {
            margin-top: 10px;
            font-size: 18px;
        }

        .card p {
            margin-top: 5px;
            color: gray;
        }

        @media (max-width: 768px) {
            .dashboard-container {
                flex-direction: column;
            }
            .sidebar {
                width: 100%;
                text-align: center;
                padding: 10px;
            }
            .sidebar a {
                display: inline-block;
                margin: 5px;
            }
        }
    </style>
</head>
<body>

<div class="dashboard-container">
    <div class="sidebar">
        <h2>Dashboard</h2>
        <a href="dashboard.php"><i class="fas fa-home"></i> Home</a>
        <a href="profile.php"><i class="fas fa-user"></i> Profile</a>
        <a href="#"><i class="fas fa-cog"></i> Settings</a>
        <a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a>
    </div>
    
    <div class="content">
        <div class="header">
            <div class="user-info">
                <img src="<?= $user['picture'] ?>" alt="User Image">
                <h1>Welcome, <?= htmlspecialchars($user['name']) ?>!</h1>
            </div>
            <button class="logout-btn" onclick="window.location.href='logout.php'">Logout</button>
        </div>
        
        <div class="cards">
            <div class="card">
                <i class="fas fa-users"></i>
                <h3>Users</h3>
                <p>Manage user accounts</p>
            </div>
            <div class="card">
                <i class="fas fa-chart-line"></i>
                <h3>Analytics</h3>
                <p>View website statistics</p>
            </div>
            <div class="card">
                <i class="fas fa-cogs"></i>
                <h3>Settings</h3>
                <p>Modify your preferences</p>
            </div>
        </div>
    </div>
</div>

</body>
</html>
