import type { Response } from "express";
import { prisma } from "../../prisma.js";
import type { AuthenticatedRequest } from "../../middleware/auth/auth.js";
import { Role } from "@prisma/client";

export const createShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId: requestedUserId, startLocal, endLocal, timezone, breakMinutes, notes } =
            req.body;

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const authenticatedUserId = req.user.userId;
        const userRole = req.user.role;

        if (!startLocal || !endLocal || !timezone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Default: user creates shift for themselves
        let targetUserId = authenticatedUserId;

        // OWNER or MANAGER may create shift for others
        if (requestedUserId && userRole !== Role.EMPLOYEE && userRole !== Role.CUSTOMER) {
            targetUserId = requestedUserId;
        }

        // EMPLOYEE trying to specify someone else => forbidden
        if (requestedUserId && userRole === Role.EMPLOYEE) {
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }

        const startUtc = new Date(startLocal);
        const endUtc = new Date(endLocal);

        const totalMinutes = (endUtc.getTime() - startUtc.getTime()) / 60000;
        const durationMinutes = Math.max(0, totalMinutes - (Number(breakMinutes) || 0));

        const shift = await prisma.shift.create({
            data: {
                userId: targetUserId,
                startUtc,
                endUtc,
                timezone,
                breakMinutes: Number(breakMinutes) || 0,
                notes,
                durationMinutes,
            },
        });

        return res.status(201).json(shift);
    } catch (err) {
        console.error("Error creating shift:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getShiftsForUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const authenticatedUserId = req.user.userId;
        const userRole = req.user.role;
        const requestedUserId = req.params.userId;

        let targetUserId = authenticatedUserId;

        // Allow OWNER/MANAGER to view others
        if (requestedUserId) {
            if (userRole === Role.MANAGER || userRole === Role.OWNER) {
                targetUserId = requestedUserId;
            } else {
                return res.status(403).json({ error: "Forbidden" });
            }
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
                    lt: endDate,
                },
            };
        }

        const whereClause = { userId: targetUserId, ...dateFilter };

        const shifts = await prisma.shift.findMany({
            where: whereClause,
            orderBy: { startUtc: "desc" },
        });

        const total = await prisma.shift.aggregate({
            where: whereClause,
            _sum: { durationMinutes: true },
        });

        return res.status(200).json({
            shifts,
            totalMinutes: total._sum.durationMinutes || 0,
        });
    } catch (err) {
        console.error("Error fetching shifts:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateShift = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const authenticatedUserId = req.user.userId;
        const userRole = req.user.role;
        const { shiftId } = req.params;

        if (!shiftId) {
            return res.status(400).json({ error: "Missing shiftId parameter" });
        }

        const existingShift = await prisma.shift.findUnique({
            where: { id: shiftId },
        });

        if (!existingShift) {
            return res.status(404).json({ error: "Shift not found" });
        }

        const isOwnerOfShift = existingShift.userId === authenticatedUserId;
        const isManagerOrOwner = userRole === Role.MANAGER || userRole === Role.OWNER;

        if (!isOwnerOfShift && !isManagerOrOwner) {
            return res.status(403).json({ error: "Forbidden: cannot modify another user's shift" });
        }

        const { startLocal, endLocal, timezone, breakMinutes, notes } = req.body;

        const updatePayload: any = {};

        if (startLocal) updatePayload.startUtc = new Date(startLocal);
        if (endLocal) updatePayload.endUtc = new Date(endLocal);
        if (timezone) updatePayload.timezone = timezone;
        if (notes !== undefined) updatePayload.notes = notes;
        if (breakMinutes !== undefined) updatePayload.breakMinutes = Number(breakMinutes) || 0;

        const newStart = updatePayload.startUtc ?? existingShift.startUtc;
        const newEnd = updatePayload.endUtc ?? existingShift.endUtc;
        const newBreak =
            updatePayload.breakMinutes ?? existingShift.breakMinutes;

        const totalMinutes = (newEnd.getTime() - newStart.getTime()) / 60000;
        updatePayload.durationMinutes = Math.max(0, totalMinutes - newBreak);

        const updatedShift = await prisma.shift.update({
            where: { id: shiftId },
            data: updatePayload,
        });

        return res.status(200).json(updatedShift);
    } catch (err) {
        console.error("Error updating shift:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export async function getAllWorkers(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userRole = req.user.role;

        if (userRole !== Role.OWNER && userRole !== Role.MANAGER) {
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }

        const { month, year } = req.query;
        let startOfMonth: Date | null = null;
        let endOfMonth: Date | null = null;

        if (month && year) {
            const m = Number(month);
            const y = Number(year);

            if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
                startOfMonth = new Date(y, m - 1, 1);
                endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
            }
        }

        const users = await prisma.user.findMany({
            where: { role: { in: [Role.EMPLOYEE, Role.MANAGER, Role.OWNER] } },
            select: {
                id: true,
                name: true,
                hourlyWage: true,
                role: true,
            },
        });

        const results = await Promise.all(
            users.map(async (user) => {
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
            })
        );

        return res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching workers:", error);
        return res.status(500).json({ error: "Failed to fetch workers" });
    }
}


