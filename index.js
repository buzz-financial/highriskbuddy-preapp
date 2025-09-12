const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { DatabaseClient } = require("./model");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize database client
const database = new DatabaseClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "./public")));
app.use("/src", express.static(path.join(__dirname, "./public/src")));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads/"));
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files
  },
  fileFilter: function (req, file, cb) {
    // Accept images and PDFs
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDF files are allowed"), false);
    }
  },
});

// Routes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    database: "SQLite connected",
  });
});

// Main form submission endpoint
app.post("/api/preapproval", upload.array("documents"), async (req, res) => {
  try {
    console.log("Received preapproval application");
    console.log("Form data keys:", Object.keys(req.body));
    console.log("Files uploaded:", req.files?.length || 0);

    // Add request metadata
    const applicationData = {
      ...req.body,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip || req.connection.remoteAddress,
      submissionMethod: "web_form",
    };

    // Save to database
    const result = await database.saveApplication(applicationData, req.files || []);

    if (result.success) {
      res.json({
        success: true,
        applicationId: result.applicationId,
        message: "Application submitted successfully",
        filesUploaded: req.files?.length || 0,
      });
    } else {
      throw new Error("Failed to save application");
    }
  } catch (error) {
    console.error("Error processing preapproval:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting application. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Admin routes for viewing submissions

// Get all applications (admin view)
app.get("/admin/applications", async (req, res) => {
  try {
    const applications = await database.getAllApplications();
    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
    });
  }
});

// Get specific application
app.get("/admin/applications/:id", async (req, res) => {
  try {
    const application = await database.getApplication(req.params.id);
    if (application) {
      res.json({
        success: true,
        application,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching application",
    });
  }
});

// Update application status
app.patch("/admin/applications/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["submitted", "under_review", "approved", "rejected", "on_hold"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const result = await database.updateApplicationStatus(req.params.id, status);
    res.json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating status",
    });
  }
});

// Get statistics
app.get("/admin/statistics", async (req, res) => {
  try {
    const stats = await database.getStatistics();
    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
    });
  }
});

// Export applications
app.get("/admin/export", async (req, res) => {
  try {
    const result = await database.exportApplicationsToJSON();
    res.json({
      success: true,
      message: `Exported ${result.count} applications`,
      exportPath: result.exportPath,
    });
  } catch (error) {
    console.error("Error exporting applications:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting applications",
    });
  }
});

// Simple admin dashboard (HTML page)
app.get("/admin", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>High Risk Buddy - Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .applications { margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status.submitted { background: #e3f2fd; color: #1976d2; }
        .status.approved { background: #e8f5e8; color: #2e7d32; }
        .status.rejected { background: #ffebee; color: #c62828; }
        button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>High Risk Buddy - Admin Dashboard</h1>
    
    <div id="stats" class="stats">
        <div class="stat-card">
            <h3>Total Applications</h3>
            <div id="total">Loading...</div>
        </div>
        <div class="stat-card">
            <h3>Today</h3>
            <div id="today">Loading...</div>
        </div>
        <div class="stat-card">
            <h3>This Week</h3>
            <div id="thisWeek">Loading...</div>
        </div>
        <div class="stat-card">
            <h3>This Month</h3>
            <div id="thisMonth">Loading...</div>
        </div>
    </div>

    <div class="applications">
        <h2>Recent Applications</h2>
        <button onclick="refreshApplications()">Refresh</button>
        <button onclick="exportApplications()">Export All</button>
        <table id="applicationsTable">
            <thead>
                <tr>
                    <th>Application ID</th>
                    <th>Business Name</th>
                    <th>Email</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="applicationsBody">
                <tr><td colspan="6">Loading...</td></tr>
            </tbody>
        </table>
    </div>

    <script>
        async function loadStatistics() {
            try {
                const response = await fetch('/admin/statistics');
                const data = await response.json();
                if (data.success) {
                    document.getElementById('total').textContent = data.statistics.total;
                    document.getElementById('today').textContent = data.statistics.today;
                    document.getElementById('thisWeek').textContent = data.statistics.thisWeek;
                    document.getElementById('thisMonth').textContent = data.statistics.thisMonth;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        }

        async function loadApplications() {
            try {
                const response = await fetch('/admin/applications');
                const data = await response.json();
                if (data.success) {
                    const tbody = document.getElementById('applicationsBody');
                    tbody.innerHTML = '';
                    
                    data.applications.forEach(app => {
                        const row = document.createElement('tr');
                        row.innerHTML = \`
                            <td>\${app.applicationId}</td>
                            <td>\${app.data.dbaName || 'N/A'}</td>
                            <td>\${app.data.businessEmail || 'N/A'}</td>
                            <td>\${new Date(app.submittedAt).toLocaleDateString()}</td>
                            <td><span class="status \${app.status}">\${app.status}</span></td>
                            <td>
                                <button onclick="viewApplication('\${app.applicationId}')">View</button>
                            </td>
                        \`;
                        tbody.appendChild(row);
                    });
                }
            } catch (error) {
                console.error('Error loading applications:', error);
            }
        }

        function refreshApplications() {
            loadApplications();
            loadStatistics();
        }

        async function exportApplications() {
            try {
                const response = await fetch('/admin/export');
                const data = await response.json();
                alert(data.message);
            } catch (error) {
                alert('Error exporting applications');
            }
        }

        function viewApplication(id) {
            window.open(\`/admin/applications/\${id}\`, '_blank');
        }

        // Load data on page load
        loadStatistics();
        loadApplications();
        
        // Auto-refresh every 30 seconds
        setInterval(refreshApplications, 30000);
    </script>
</body>
</html>
  `);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
  }

  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await database.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await database.close();
  process.exit(0);
});

app.listen(PORT, function () {
  console.log(`Server ready. Listening on port ${PORT}`);
  console.log(`Form available at: http://localhost:${PORT}`);
  console.log(`Admin dashboard at: http://localhost:${PORT}/admin`);
});
