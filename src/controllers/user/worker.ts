import type { Response } from 'express';
import { prisma } from "../../prisma.js";
import type { AuthenticatedRequest } from '../../middleware/auth/auth.js';
import { Role } from '@prisma/client';



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

export async function getAllWorkers(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Fetch the requesting user's role
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { role: true },
        });

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Only OWNER or MANAGER can access
        if (currentUser.role !== Role.OWNER && currentUser.role !== Role.MANAGER) {
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }

        // Optional month/year filter
        const { month, year } = req.query;
        let startOfMonth: Date | null = null;
        let endOfMonth: Date | null = null;

        if (month && year) {
            const monthNum = parseInt(month as string, 10);
            const yearNum = parseInt(year as string, 10);

            if (!isNaN(monthNum) && !isNaN(yearNum) && monthNum >= 1 && monthNum <= 12) {
                startOfMonth = new Date(yearNum, monthNum - 1, 1);
                endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
            }
        }

        // Fetch users with allowed roles
        const users = await prisma.user.findMany({
            where: {
                role: { in: [Role.EMPLOYEE, Role.MANAGER, Role.OWNER] },
            },
            select: {
                id: true,
                name: true,
                // @ts-ignore
                hourlyWage: true,
                role: true,
            },
        });

        // For each user, calculate total minutes worked in the month
        const results = await Promise.all(users.map(async (user) => {
            const where: any = { userId: user.id };
            if (startOfMonth && endOfMonth) {
                where.startUtc = { gte: startOfMonth, lte: endOfMonth };
            }

            const total = await prisma.shift.aggregate({
                _sum: { durationMinutes: true },
                where,
            });

            return {
                ...user,
                totalMinutesWorked: total._sum.durationMinutes ?? 0,
            };
        }));

        return res.status(200).json(results);

    } catch (error) {
        console.error("Error fetching workers:", error);
        return res.status(500).json({ error: "Failed to fetch workers" });
    }
}