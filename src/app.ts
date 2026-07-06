import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ status: "UP", timestamp: new Date().toISOString() });
});

export default app;
