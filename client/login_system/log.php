<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login & Signup Form</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <script src="script.js" defer></script>
    <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@300;400;600&display=swap" rel="stylesheet">
    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
</head>
<body>

    <div class="container">
        <div class="forms-container">
            <div class="signin-signup">
                <!-- Sign In Form -->
                <form action="#" class="sign-in-form">
                    <h2 class="title">Sign In</h2>
                    <div class="input-field">
                        <i class="fas fa-user"></i>
                        <input type="text" placeholder="Username" required>
                    </div>
                    <div class="input-field">
                        <i class="fas fa-lock"></i>
                        <input type="password" placeholder="Password" required>
                    </div>
                    <button class="btn">Login</button>
                    <p class="social-text">Or Sign in with social platforms</p>
                    <div class="social-media">
                        <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-google"></i></a>
                    </div>
                </form>

                <!-- Sign Up Form -->
                <form action="#" class="sign-up-form">
                    <h2 class="title">Sign Up</h2>
                    <div class="input-field">
                        <i class="fas fa-user"></i>
                        <input type="text" placeholder="Username" required>
                    </div>
                    <div class="input-field">
                        <i class="fas fa-envelope"></i>
                        <input type="email" placeholder="Email" required>
                    </div>
                    <div class="input-field">
                        <i class="fas fa-lock"></i>
                        <input type="password" placeholder="Password" required>
                    </div>
                    <button class="btn">Sign Up</button>
                    <p class="social-text">Or Sign up with social platforms</p>
                    <div class="social-media">
                        <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-google"></i></a>
                    </div>
                </form>
            </div>
        </div>

        <!-- Panels for animation -->
        <div class="panels-container">
            <div class="panel left-panel">
                <div class="content">
                    <h3>New here?</h3>
                    <p>Sign up and discover a world of possibilities.</p>
                    <button class="btn transparent" id="sign-up-btn">Sign Up</button>
                </div>
            </div>
            <div class="panel right-panel">
                <div class="content">
                    <h3>Already have an account?</h3>
                    <p>Sign in and continue your journey.</p>
                    <button class="btn transparent" id="sign-in-btn">Sign In</button>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
