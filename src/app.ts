import express from "express";
import userRoutes from './routes/user/index.js'

const app = express();

// Middleware
app.use(express.json());
app.use('/users', userRoutes);

// Routes
app.get("/", (_req, res) => {
    res.send("Fudge!");
});

export default app;
