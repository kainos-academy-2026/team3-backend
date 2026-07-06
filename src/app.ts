import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to your API!" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "UP", timestamp: new Date().toISOString() });
});

export default app;
