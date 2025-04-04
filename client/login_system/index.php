<?php
session_start();
if (isset($_SESSION['user'])) {
    header("Location: dashboard.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <script src="https://kit.fontawesome.com/64d58efce2.js" crossorigin="anonymous"></script>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
    <title>Login/Signup</title>
</head>
<body>
    <div class="block">
    <div class="container">
        <div class="forms-container">
            <div class="signin-signup">
                <!-- LOGIN FORM -->
                <form id="loginForm" class="sign-in-form">
                    <h2 class="title">Sign in</h2>
                    <div class="input-field">
                        <i class="fas fa-user"></i>
                        <input type="email" name="email" placeholder="Email" required>
                    </div>
                    <div class="input-field">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="password" placeholder="Password" required>
                    </div>
                    <input type="submit" value="Login" class="btn solid">
                    <p class="error-message" id="loginMessage"></p>
                    <p class="social_text"> OR login with social channels</p>
                    <div class="social-media">
                        <!-- <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a> -->
                        <!-- <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> -->
                        <a href="google.php?redirect_to=dashboard.php" class="social-icon"><i class="fab fa-google"></i></a>
                        <!-- <a href="#" class="social-icon"><i class="fab fa-github"></i></a> -->
                    </div>
                </form>

                <!-- REGISTER FORM -->
                <form id="registerForm" class="sign-up-form">
                    <h2 class="title">Sign up</h2>
                    <div class="input-field">
                        <i class="fas fa-user"></i>
                        <input type="text" name="username" placeholder="Username" required>
                    </div>
                    <div class="input-field">
                        <i class="fas fa-envelope"></i>
                        <input type="email" name="email" placeholder="Email" required>
                    </div>
                    <div class="input-field">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="password" placeholder="Password" required>
                    </div>
                    <input type="submit" value="Sign up" class="btn solid">
                    <p class="error-message" id="registerMessage"></p>
                    <p class="social_text"> OR Register with social channels</p>
                    <div class="social-media">
                        <!-- <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a> -->
                        <!-- <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> -->
                        <a href="google.php?redirect_to=dashboard.php" class="social-icon"><i class="fab fa-google"></i></a>
                        <!-- <a href="#" class="social-icon"><i class="fab fa-github"></i></a> -->
                    </div>
                </form>
            </div>
        </div>

        <!-- Panels -->
        <div class="panels-container">
            <div class="panel left-panel">
                <div class="content">
                    <h3>New user?</h3>
                    <p>Join us and enjoy a seamless experience.</p>
                    <button class="btn transparent" id="sign-up-btn">Register</button>
                </div>
                <img src="assets/images/log.png" alt="" class="image">
            </div>
            <div class="panel right-panel">
                <div class="content">
                    <h3>One of us?</h3>
                    <p>Login and explore your personalized space.</p>
                    <button class="btn transparent" id="sign-in-btn">Sign in</button>
                </div>
                <img src="assets/images/register.png" alt="" class="image">
            </div>
        </div>
    </div>
</div>
    <script src="assets/js/script.js"></script>
</body>
</html>
