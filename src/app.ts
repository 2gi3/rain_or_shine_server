import express, { type Request, type Response } from "express";
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
app.get("/", (_req: Request, res: Response) => {
    res.send("Fudge!");
});

export default app;
