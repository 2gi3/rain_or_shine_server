import type { Response } from 'express';
import { prisma } from "../../prisma.js";
import type { AuthenticatedRequest } from '../../middleware/auth/auth.js';



const ADMIN_ID = "1234567";

export const createShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            userId: requestedUserId,
            startLocal,
            endLocal,
            timezone,
            breakMinutes,
            notes
        } = req.body;

        const authenticatedUserId = req.user?.userId;

        if (!authenticatedUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!startLocal || !endLocal || !timezone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Default: user creates shift for themselves
        let targetUserId = authenticatedUserId;

        // If admin and body contains a userId → allow override
        if (authenticatedUserId === ADMIN_ID && requestedUserId) {
            targetUserId = requestedUserId;
        }

        // Convert time
        const startUtc = new Date(startLocal);
        const endUtc = new Date(endLocal);

        const totalMinutes = (endUtc.getTime() - startUtc.getTime()) / 60000;
        const durationMinutes = Math.max(
            0,
            totalMinutes - (Number(breakMinutes) || 0)
        );

        const shift = await prisma.shift.create({
            data: {
                userId: targetUserId,
                startUtc,
                endUtc,
                timezone,
                breakMinutes: Number(breakMinutes) || 0,
                notes,
                durationMinutes
            }
        });

        return res.status(201).json(shift);
    } catch (err) {
        console.error("Error creating shift:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// export const createShift = async (req: Request, res: Response) => {
//     try {
//         const {
//             userId,
//             startLocal,
//             endLocal,
//             timezone,
//             breakMinutes,
//             notes
//         } = req.body;

//         if (!userId || !startLocal || !endLocal || !timezone) {
//             return res.status(400).json({ error: "Missing required fields" });
//         }

//         // Convert to UTC 
//         const startUtc = new Date(startLocal);
//         const endUtc = new Date(endLocal);

//         const totalMinutes = (endUtc.getTime() - startUtc.getTime()) / 60000;
//         const durationMinutes = Math.max(0, totalMinutes - (Number(breakMinutes) || 0));

//         const shift = await prisma.shift.create({
//             data: {
//                 userId,
//                 startUtc,
//                 endUtc,
//                 timezone,
//                 breakMinutes: Number(breakMinutes) || 0,
//                 notes,
//                 durationMinutes
//             }
//         });

//         return res.status(201).json(shift);
//     } catch (err: any) {
//         console.error(err);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };





export const getShiftsForUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const authenticatedUserId = req.user?.userId;
        const requestedUserId = req.params.userId; // optional

        if (!authenticatedUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Default: return the authenticated user's own shifts
        let targetUserId = authenticatedUserId;

        // If admin AND a userId was provided in the URL, allow querying another user
        if (authenticatedUserId === ADMIN_ID && requestedUserId) {
            targetUserId = requestedUserId;
        }

        // If non-admin tries to access with a URL param -> forbidden
        if (authenticatedUserId !== ADMIN_ID && requestedUserId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const shifts = await prisma.shift.findMany({
            where: { userId: targetUserId },
            orderBy: { startUtc: "desc" }
        });

        return res.status(200).json(shifts);
    } catch (err) {
        console.error("Error fetching shifts:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
