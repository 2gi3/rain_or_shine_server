import type { Request, Response } from 'express';
import { prisma } from "../../prisma.js";

export const createShift = async (req: Request, res: Response) => {
    try {
        const {
            userId,
            startLocal,
            endLocal,
            timezone,
            breakMinutes,
            notes
        } = req.body;

        if (!userId || !startLocal || !endLocal || !timezone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert to UTC 
        const startUtc = new Date(startLocal);
        const endUtc = new Date(endLocal);

        const totalMinutes = (endUtc.getTime() - startUtc.getTime()) / 60000;
        const durationMinutes = Math.max(0, totalMinutes - (Number(breakMinutes) || 0));

        const shift = await prisma.shift.create({
            data: {
                userId,
                startUtc,
                endUtc,
                timezone,
                breakMinutes: Number(breakMinutes) || 0,
                notes,
                durationMinutes
            }
        });

        return res.status(201).json(shift);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
