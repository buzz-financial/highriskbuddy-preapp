const sqlite3 = require("sqlite3").verbose();
const fs = require("fs-extra");
const path = require("path");

class DatabaseClient {
  constructor() {
    this.dbPath = path.join(__dirname, "applications.db");
    this.init();
  }

  init() {
    // Ensure uploads directory exists
    fs.ensureDirSync(path.join(__dirname, "uploads"));

    // Initialize database
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database");
        this.createTables();
      }
    });
  }

  createTables() {
    const createApplicationsTable = `
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL,
        files_info TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'submitted'
      )
    `;

    this.db.run(createApplicationsTable, (err) => {
      if (err) {
        console.error("Error creating applications table:", err.message);
      } else {
        console.log("Applications table ready");
      }
    });
  }

  // Save application data
  async saveApplication(applicationData, files = []) {
    return new Promise((resolve, reject) => {
      const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Prepare application data with metadata
      const completeData = {
        ...applicationData,
        applicationId,
        submittedAt: new Date().toISOString(),
        formVersion: "1.0",
        userAgent: applicationData.userAgent || "Unknown",
        ipAddress: applicationData.ipAddress || "Unknown",
      };

      // Prepare files information
      const filesInfo = files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      }));

      const query = `
        INSERT INTO applications (application_id, data, files_info, status)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          applicationId,
          JSON.stringify(completeData, null, 2),
          JSON.stringify(filesInfo),
          "submitted",
        ],
        function (err) {
          if (err) {
            console.error("Database insert error:", err.message);
            reject(err);
          } else {
            console.log(`Application saved with ID: ${applicationId}`);
            resolve({
              success: true,
              applicationId,
              dbId: this.lastID,
            });
          }
        }
      );
    });
  }

  // Get all applications
  async getAllApplications() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, application_id, data, files_info, submitted_at, status
        FROM applications
        ORDER BY submitted_at DESC
      `;

      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const applications = rows.map((row) => ({
            id: row.id,
            applicationId: row.application_id,
            data: JSON.parse(row.data),
            files: JSON.parse(row.files_info || "[]"),
            submittedAt: row.submitted_at,
            status: row.status,
          }));
          resolve(applications);
        }
      });
    });
  }

  // Get application by ID
  async getApplication(applicationId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM applications WHERE application_id = ?
      `;

      this.db.get(query, [applicationId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            id: row.id,
            applicationId: row.application_id,
            data: JSON.parse(row.data),
            files: JSON.parse(row.files_info || "[]"),
            submittedAt: row.submitted_at,
            status: row.status,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Update application status
  async updateApplicationStatus(applicationId, status) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE applications SET status = ? WHERE application_id = ?
      `;

      this.db.run(query, [status, applicationId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  // Export applications to JSON
  async exportApplicationsToJSON() {
    try {
      const applications = await this.getAllApplications();
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalApplications: applications.length,
        applications,
      };

      const exportPath = path.join(__dirname, `exports/applications-${Date.now()}.json`);
      fs.ensureDirSync(path.dirname(exportPath));

      await fs.writeJSON(exportPath, exportData, { spaces: 2 });
      return { success: true, exportPath, count: applications.length };
    } catch (error) {
      throw error;
    }
  }

  // Get statistics
  async getStatistics() {
    return new Promise((resolve, reject) => {
      const queries = {
        total: "SELECT COUNT(*) as count FROM applications",
        today: `SELECT COUNT(*) as count FROM applications WHERE date(submitted_at) = date('now')`,
        thisWeek: `SELECT COUNT(*) as count FROM applications WHERE submitted_at >= date('now', '-7 days')`,
        thisMonth: `SELECT COUNT(*) as count FROM applications WHERE submitted_at >= date('now', 'start of month')`,
      };

      const stats = {};
      let completed = 0;
      const total = Object.keys(queries).length;

      Object.entries(queries).forEach(([key, query]) => {
        this.db.get(query, (err, row) => {
          if (err) {
            console.error(`Error getting ${key} stats:`, err);
            stats[key] = 0;
          } else {
            stats[key] = row.count;
          }

          completed++;
          if (completed === total) {
            resolve(stats);
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
        } else {
          console.log("Database connection closed");
        }
        resolve();
      });
    });
  }
}

module.exports = {
  DatabaseClient,
};
