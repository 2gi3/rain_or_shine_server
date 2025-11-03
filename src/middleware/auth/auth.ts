import { ENV } from "../../env.js";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = ENV.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
    user?: { userId: string; email?: string };
}

export async function auth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers["authorization"];
        let token: string | undefined;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
            return;
        }

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.status(401).json({ error: "Unauthorized: invalid or expired token" });
            return;
        }

        req.user = {
            userId: payload.userId,
            email: payload.email,
        };

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
}