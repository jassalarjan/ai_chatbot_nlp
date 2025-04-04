<?php
session_start();
require '../vendor/autoload.php';

// Enable Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Google API Configuration
$client = new Google_Client();
$client->setClientId('1018567991734-nbgin06nscpgm1skt519r150mv8aqc9s.apps.googleusercontent.com');
$client->setClientSecret('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');
$client->setRedirectUri('http://localhost:8888/college_files/task_1/google.php');
$client->addScope('email');
$client->addScope('profile');

// Handle Google OAuth Response
if (isset($_GET['code'])) {
    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    
    if (!isset($token['error'])) {
        $client->setAccessToken($token);
        $oauth = new Google_Service_Oauth2($client);
        $userInfo = $oauth->userinfo->get();

        // Store user data in session
        $_SESSION['user'] = [
            'id' => $userInfo->id,
            'name' => $userInfo->name,
            'email' => $userInfo->email,
            'picture' => $userInfo->picture,
        ];

        // Redirect to Dashboard
        header("Location: dashboard.php");
        exit();
    } else {
        echo "Error: " . $token['error_description'];
        exit();
    }
}

// If already logged in, redirect to dashboard
if (isset($_SESSION['user'])) {
    header("Location: dashboard.php");
    exit();
}

// Generate Google Login URL
$login_url = $client->createAuthUrl();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login with Google</title>

    <!-- Bootstrap CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome for Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        body {
            background-color: #f4f4f9;
        }
        .login-container {
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .login-card {
            padding: 30px;
            border-radius: 10px;
            background: #fff;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .google-btn {
            background: #db4437;
            color: #fff;
            border: none;
            width: 100%;
            padding: 12px;
            font-size: 18px;
            font-weight: 500;
            border-radius: 5px;
            transition: 0.3s;
        }
        .google-btn:hover {
            background: #c1351d;
        }
        .google-btn i {
            margin-right: 8px;
        }
    </style>
</head>
<body>

    <div class="container login-container">
        <div class="col-md-4">
            <div class="login-card">
                <h2 class="mb-4">Login</h2>
                <a href="<?= $login_url ?>" class="btn google-btn">
                    <i class="fab fa-google"></i> Sign in with Google
                </a>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>
