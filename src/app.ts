import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
    res.send("Fudge!");
});

export default app;
