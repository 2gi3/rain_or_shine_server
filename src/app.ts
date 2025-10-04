import express from "express";
import userRoutes from './routes/user/index.js'
import cors from "cors";


const app = express();
app.use(cors({
    origin: "http://localhost:8081"
}));

// Middleware
app.use(express.json());
app.use('/users', userRoutes);

// Routes
app.get("/", (_req, res) => {
    res.send("Fudge!");
});

export default app;
