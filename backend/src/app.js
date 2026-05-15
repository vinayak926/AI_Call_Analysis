const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/analysis", require("./routes/analysisRoutes")); // baad me add karna

// Health check
app.get("/", (req, res) => {
  res.json({ message: "🚀 CallIntel AI Backend Running" });
});

module.exports = app;