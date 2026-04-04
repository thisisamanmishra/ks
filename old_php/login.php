<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - KaryaSaarthi</title>
    <link rel="icon" type="image/jpeg" href="images/karyasaarthi.jpeg">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }

        /* Animated background shapes */
        .bg-shape {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            animation: float 20s ease-in-out infinite;
        }

        .bg-shape:nth-child(1) {
            width: 300px;
            height: 300px;
            top: -150px;
            left: -150px;
            animation-delay: 0s;
        }

        .bg-shape:nth-child(2) {
            width: 200px;
            height: 200px;
            bottom: -100px;
            right: -100px;
            animation-delay: 5s;
        }

        .bg-shape:nth-child(3) {
            width: 150px;
            height: 150px;
            top: 50%;
            left: 10%;
            animation-delay: 10s;
        }

        @keyframes float {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            33% {
                transform: translate(30px, -30px) rotate(120deg);
            }
            66% {
                transform: translate(-20px, 20px) rotate(240deg);
            }
        }

        .login-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 30px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            max-width: 450px;
            width: 100%;
            padding: 50px 40px;
            backdrop-filter: blur(10px);
            animation: slideIn 0.5s ease-out;
            position: relative;
            z-index: 10;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .logo-section {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo-section img {
            height: 70px;
            margin-bottom: 20px;
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.2));
            animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        .logo-section h2 {
            color: #1f2937;
            font-weight: 700;
            font-size: 1.8rem;
            margin-bottom: 8px;
        }

        .logo-section p {
            color: #6b7280;
            font-size: 0.95rem;
        }

        .form-floating {
            margin-bottom: 25px;
            position: relative;
        }

        .form-floating input {
            border: 2px solid #e5e7eb;
            border-radius: 15px;
            height: 60px;
            font-size: 1rem;
            padding-left: 45px;
            transition: all 0.3s;
            background: #f9fafb;
        }

        .form-floating input:focus {
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.15);
            outline: none;
        }

        .form-floating label {
            color: #6b7280;
            font-size: 0.95rem;
            left: 45px;
        }

        .form-floating i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            font-size: 1.2rem;
            z-index: 10;
            transition: color 0.3s;
        }

        .form-floating:focus-within i {
            color: #667eea;
        }

        .password-toggle {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #6b7280;
            font-size: 1.2rem;
            z-index: 10;
            background: none;
            border: none;
        }

        .password-toggle:hover {
            color: #667eea;
        }

        .remember-forgot {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }

        .form-check {
            margin: 0;
        }

        .form-check-input:checked {
            background-color: #667eea;
            border-color: #667eea;
        }

        .form-check-label {
            color: #6b7280;
            font-size: 0.9rem;
            cursor: pointer;
            user-select: none;
        }

        .forgot-link {
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.3s;
        }

        .forgot-link:hover {
            color: #764ba2;
            text-decoration: underline;
        }

        .btn-login {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 15px;
            color: white;
            padding: 16px;
            font-size: 1.1rem;
            font-weight: 600;
            width: 100%;
            margin-top: 10px;
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .btn-login::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }

        .btn-login:hover::before {
            left: 100%;
        }

        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
        }

        .divider {
            text-align: center;
            margin: 30px 0;
            position: relative;
        }

        .divider::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
        }

        .divider span {
            background: rgba(255, 255, 255, 0.95);
            padding: 0 20px;
            position: relative;
            color: #9ca3af;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .social-login {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;
        }

        .social-btn {
            flex: 1;
            padding: 14px;
            border: 2px solid #e5e7eb;
            border-radius: 15px;
            background: white;
            color: #374151;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
            cursor: pointer;
            text-decoration: none;
            font-size: 0.95rem;
        }

        .social-btn:hover {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .signup-link {
            text-align: center;
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.95rem;
        }

        .signup-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s;
        }

        .signup-link a:hover {
            color: #764ba2;
            text-decoration: underline;
        }

        .alert {
            border-radius: 15px;
            margin-bottom: 25px;
            border: none;
            animation: shake 0.5s;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }

        .loading-spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .back-home {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            transition: all 0.3s;
            z-index: 100;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 50px;
            backdrop-filter: blur(10px);
        }

        .back-home:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateX(-5px);
        }

        @media (max-width: 500px) {
            .login-container {
                padding: 40px 25px;
            }

            .logo-section h2 {
                font-size: 1.5rem;
            }

            .social-login {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Background shapes -->
    <div class="bg-shape"></div>
    <div class="bg-shape"></div>
    <div class="bg-shape"></div>

    <!-- Back to home link -->
    <a href="index.html" class="back-home">
        <i class="bi bi-arrow-left"></i>
        Back to Home
    </a>

    <div class="login-container">
        <div class="logo-section">
            <img src="images/karyasaarthi.jpeg" alt="KaryaSaarthi Logo">
            <h2>Welcome Back!</h2>
            <p>Sign in to continue to your account</p>
        </div>

        <?php
        session_start();
        if(isset($_SESSION['error'])) {
            echo '<div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>'.$_SESSION['error'].'
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                  </div>';
            unset($_SESSION['error']);
        }
        if(isset($_SESSION['success'])) {
            echo '<div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i>'.$_SESSION['success'].'
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                  </div>';
            unset($_SESSION['success']);
        }
        ?>

        <form action="process_login.php" method="POST" id="loginForm">
            <div class="form-floating">
                <i class="bi bi-envelope"></i>
                <input type="email" class="form-control" id="email" name="email" placeholder="name@example.com" required autofocus>
                <label for="email">Email Address</label>
            </div>

            <div class="form-floating position-relative">
                <i class="bi bi-lock"></i>
                <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                <label for="password">Password</label>
                <button type="button" class="password-toggle" onclick="togglePassword()">
                    <i class="bi bi-eye" id="toggleIcon"></i>
                </button>
            </div>

            <div class="remember-forgot">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="remember" name="remember">
                    <label class="form-check-label" for="remember">
                        Remember me
                    </label>
                </div>
                <a href="#" class="forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" class="btn btn-login">
                <span id="buttonText">Sign In</span>
                <div class="loading-spinner" id="loadingSpinner"></div>
            </button>
        </form>

        <div class="divider">
            <span>or continue with</span>
        </div>

        <div class="social-login">
            <a href="https://wa.me/917991124091" class="social-btn">
                <i class="bi bi-whatsapp" style="color: #25D366; font-size: 1.2rem;"></i>
                WhatsApp
            </a>
            <a href="tel:+919311025753" class="social-btn">
                <i class="bi bi-telephone-fill" style="color: #667eea; font-size: 1.2rem;"></i>
                Call
            </a>
        </div>

        <div class="signup-link">
            Don't have an account? <a href="signup.php">Create Account</a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('toggleIcon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('bi-eye');
                toggleIcon.classList.add('bi-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('bi-eye-slash');
                toggleIcon.classList.add('bi-eye');
            }
        }

        // Form submission animation
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            const btn = document.querySelector('.btn-login');
            const btnText = document.getElementById('buttonText');
            const spinner = document.getElementById('loadingSpinner');

            btnText.style.display = 'none';
            spinner.style.display = 'block';
        });

        // Add floating animation to input fields
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
            });

            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
        });
    </script>
</body>
</html>