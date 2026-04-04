<?php
require_once 'config.php';

// Check if user is logged in
requireLogin();

$user_name = $_SESSION['user_name'];
$user_type = $_SESSION['user_type'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - KaryaSaarthi</title>
    <link rel="icon" type="image/jpeg" href="images/karyasaarthi.jpeg">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <style>
        .sidebar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .sidebar a {
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            display: block;
            transition: background 0.3s;
        }
        .sidebar a:hover {
            background: rgba(255,255,255,0.1);
        }
        .card-stat {
            border: none;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 px-0 sidebar">
                <div class="p-3">
                    <img src="images/karyasaarthi.jpeg" alt="Logo" height="40" class="mb-3">
                    <h5>KaryaSaarthi</h5>
                </div>
                <nav>
                    <a href="dashboard.php"><i class="bi bi-speedometer2"></i> Dashboard</a>
                    <a href="#"><i class="bi bi-file-text"></i> My Requests</a>
                    <a href="#"><i class="bi bi-clock-history"></i> History</a>
                    <a href="#"><i class="bi bi-person"></i> Profile</a>
                    <a href="#"><i class="bi bi-gear"></i> Settings</a>
                    <a href="logout.php"><i class="bi bi-box-arrow-right"></i> Logout</a>
                </nav>
            </div>

            <!-- Main Content -->
            <div class="col-md-9 col-lg-10">
                <!-- Header -->
                <div class="bg-white shadow-sm p-3 mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <h4>Welcome, <?php echo htmlspecialchars($user_name); ?>!</h4>
                        <div>
                            <span class="badge bg-primary"><?php echo ucfirst($user_type); ?></span>
                            <a href="index.html" class="btn btn-sm btn-outline-primary ms-2">View Website</a>
                        </div>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card card-stat text-center p-3">
                            <i class="bi bi-file-earmark-text fs-1 text-primary"></i>
                            <h3>0</h3>
                            <p>Total Requests</p>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card card-stat text-center p-3">
                            <i class="bi bi-hourglass-split fs-1 text-warning"></i>
                            <h3>0</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card card-stat text-center p-3">
                            <i class="bi bi-clock fs-1 text-info"></i>
                            <h3>0</h3>
                            <p>In Progress</p>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card card-stat text-center p-3">
                            <i class="bi bi-check-circle fs-1 text-success"></i>
                            <h3>0</h3>
                            <p>Completed</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5>Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <?php if($user_type == 'student'): ?>
                            <div class="col-md-4 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">
                                    <i class="bi bi-journal-text"></i> Request Thesis Help
                                </a>
                            </div>
                            <div class="col-md-4 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">
                                    <i class="bi bi-file-text"></i> Assignment Help
                                </a>
                            </div>
                            <?php elseif($user_type == 'business'): ?>
                            <div class="col-md-4 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">
                                    <i class="bi bi-globe"></i> Website Development
                                </a>
                            </div>
                            <div class="col-md-4 mb-3">
                                <a href="#" class="btn btn-outline-primary w-100">
                                    <i class="bi bi-megaphone"></i> Digital Marketing
                                </a>
                            </div>
                            <?php endif; ?>
                            <div class="col-md-4 mb-3">
                                <a href="https://wa.me/917991124091" class="btn btn-outline-success w-100">
                                    <i class="bi bi-whatsapp"></i> WhatsApp Support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-header">
                        <h5>Recent Activity</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">No recent activity to show.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>