const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { HubSpotClient } = require("./model");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
app.use(cors());

// Initialize HubSpot client
const hubspot = new HubSpotClient();

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// File upload setup (for any documents)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Merchant preapproval endpoint
app.post("/api/preapproval", upload.array("documents"), async (req, res) => {
  try {
    console.log("Received preapproval application:", req.body);

    // Process the form data and send to HubSpot
    const result = await hubspot.createMerchantApplication(req.body);

    if (result.success) {
      res.json({
        success: true,
        applicationId: result.applicationId,
        message: "Application submitted successfully",
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Error processing preapproval:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting application. Please try again.",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Serve the main form
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Keep your existing user/session endpoints if needed
// ... (your existing user/session code)

app.listen(8080, function () {
  console.log("Server ready. Listening on port 8080");
});
