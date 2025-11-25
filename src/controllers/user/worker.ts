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



export const getShiftsForUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const authenticatedUserId = req.user?.userId;
        const requestedUserId = req.params.userId;

        if (!authenticatedUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let targetUserId = authenticatedUserId;

        if (authenticatedUserId === ADMIN_ID && requestedUserId) {
            targetUserId = requestedUserId;
        }

        if (authenticatedUserId !== ADMIN_ID && requestedUserId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const month = req.query.month ? Number(req.query.month) : null;

        let dateFilter = {};

        if (month !== null && month >= 0 && month <= 11) {
            const year = new Date().getFullYear();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 1);

            dateFilter = {
                startUtc: {
                    gte: startDate,
                    lt: endDate
                }
            };
        }

        const whereClause = {
            userId: targetUserId,
            ...dateFilter
        };

        const shifts = await prisma.shift.findMany({
            where: whereClause,
            orderBy: { startUtc: "desc" }
        });

        const total = await prisma.shift.aggregate({
            where: whereClause,
            _sum: {
                durationMinutes: true
            }
        });

        return res.status(200).json({
            shifts,
            totalMinutes: total._sum.durationMinutes || 0
        });

    } catch (err) {
        console.error("Error fetching shifts:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const authenticatedUserId = req.user?.userId;
        const { shiftId } = req.params;

        if (!authenticatedUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!shiftId) {
            return res.status(400).json({ error: "Missing shiftId parameter" });
        }

        const existingShift = await prisma.shift.findUnique({
            where: { id: shiftId }
        });

        if (!existingShift) {
            return res.status(404).json({ error: "Shift not found" });
        }

        const isAdmin = authenticatedUserId === ADMIN_ID;
        const isOwner = existingShift.userId === authenticatedUserId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: "Forbidden: cannot modify another user's shift" });
        }

        const {
            startLocal,
            endLocal,
            timezone,
            breakMinutes,
            notes
        } = req.body;

        const updatePayload: any = {};

        if (startLocal) updatePayload.startUtc = new Date(startLocal);
        if (endLocal) updatePayload.endUtc = new Date(endLocal);
        if (timezone) updatePayload.timezone = timezone;
        if (notes !== undefined) updatePayload.notes = notes;
        if (breakMinutes !== undefined) updatePayload.breakMinutes = Number(breakMinutes) || 0;

        const newStart = updatePayload.startUtc ?? existingShift.startUtc;
        const newEnd = updatePayload.endUtc ?? existingShift.endUtc;
        const newBreak =
            updatePayload.breakMinutes !== undefined
                ? updatePayload.breakMinutes
                : existingShift.breakMinutes;

        const totalMinutes = (newEnd.getTime() - newStart.getTime()) / 60000;
        updatePayload.durationMinutes = Math.max(0, totalMinutes - newBreak);

        const updatedShift = await prisma.shift.update({
            where: { id: shiftId }, // now guaranteed string
            data: updatePayload
        });

        return res.status(200).json(updatedShift);

    } catch (err) {
        console.error("Error updating shift:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
