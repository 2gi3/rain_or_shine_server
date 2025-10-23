import express, { type Request, type Response } from "express";
import userRoutes from './routes/user/index.js'
import authRoutes from './routes/auth/index.js'
import cookieParser from "cookie-parser";

import cors from "cors";
import corsOptions from "./middleware/CORS/options.js";
import { signup } from "./controllers/user/signup.js"



const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.post("/auth/signup", signup);
app.use("/auth", authRoutes);

app.get("/", (_req: Request, res: Response) => {
    res.send("Fudge!");
});

export default app;
