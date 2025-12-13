
import { ENV } from "../../env.js";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";
import type { Role } from "@prisma/client";

const JWT_SECRET = ENV.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email?: string;
        role: Role;
    };
}


export async function auth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized: missing token" });
            return;
        }

        const token = authHeader.slice(7); // remove "Bearer "

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch {
            res.status(401).json({ error: "Unauthorized: invalid or expired token" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { role: true },
        });

        if (!user) {
            res.status(401).json({ error: "Unauthorized: user not found" });
            return;
        }

        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: user.role,
        };

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
}



// export async function auth(
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ): Promise<void> {
//     try {
//         const authHeader = req.headers["authorization"];
//         let token: string | undefined;

//         if (authHeader?.startsWith("Bearer ")) {
//             token = authHeader.split(" ")[1];
//             console.log({ 'req.headers["authorization"]': token })
//         } else if (req.cookies?.token) {
//             token = req.cookies.token;
//             console.log({ 'req.cookies?.token': token })

//         }

//         if (!token) {
//             res.status(401).json({ error: "Unauthorized: no token provided" });
//             return;
//         }

//         let payload: any;
//         try {
//             payload = jwt.verify(token, JWT_SECRET);
//         } catch {
//             res.status(401).json({ error: "Unauthorized: invalid or expired token" });
//             return;
//         }

//         const user = await prisma.user.findUnique({
//             where: { id: payload.userId },
//             select: { role: true }
//         });

//         if (!user) {
//             res.status(401).json({ error: "Unauthorized: user not found" });
//             return;
//         }

//         req.user = {
//             userId: payload.userId,
//             email: payload.email,
//             role: user.role
//         };

//         next();
//     } catch (err) {
//         console.error("Auth middleware error:", err);
//         res.status(500).json({ error: "Authentication failed" });
//         return;
//     }
// }


