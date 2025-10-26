import { prisma } from "../../prisma.js";
import type { Request, Response } from 'express';


export async function getAllUsers(_req: Request, res: Response) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
}


export async function deleteUser(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await prisma.verificationToken.deleteMany({
            where: { identifier: user.email },
        });

        const deletedUser = await prisma.user.delete({ where: { id } });

        return res.status(200).json({
            message: `User ${deletedUser.email} deleted successfully`,
            deletedUser,
        });
    } catch (error: any) {
        console.error("Error deleting user:", error);

        if (error.code === "P2025") {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(500).json({ error: "Failed to delete user" });
    }
}