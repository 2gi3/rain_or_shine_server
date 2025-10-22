import { getSession } from "@auth/express";
import type { Request, Response, NextFunction } from "express";
import { authConfig } from "./config.js";

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const session = await getSession(req, authConfig);

        if (!session || !session.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        (req as any).user = session.user;
        next();
        return;
    } catch (err) {
        console.error("Auth error:", err);
        res.status(500).json({ error: "Authentication failed" });
        return;
    }
}
