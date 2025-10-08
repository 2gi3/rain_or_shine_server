import express, { type Request, type Response } from "express";
import userRoutes from './routes/user/index.js'
import cors from "cors";
import corsOptions from "./middleware/CORS/options.js";


const app = express();
app.use(cors(corsOptions));


app.use(express.json());
app.use('/users', userRoutes);

app.get("/", (_req: Request, res: Response) => {
    res.send("Fudge!");
});

export default app;
