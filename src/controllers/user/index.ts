import type { AuthenticatedRequest } from "@/middleware/auth/auth.js";
import { prisma } from "../../prisma.js";
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';




export async function getAllUsers(_req: Request, res: Response) {
    try {
        const users = await prisma.user.findMany({});

        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
}

function buildUpdateData(body: any, isAdmin: boolean) {
    const { name, email, hourlyWage, role, image } = body;
    const data: any = {};

    if (isAdmin) {
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (hourlyWage !== undefined) data.hourlyWage = hourlyWage;
        if (role !== undefined) data.role = role;
        if (image !== undefined) data.image = image;
    } else {
        // Regular users cannot update role or hourlyWage
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (image !== undefined) data.image = image;
    }

    return data;
}

// Admin updates any user by ID
export async function updateUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "User ID is required" });

    try {
        const requestingUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        if (!requestingUser || requestingUser.role !== Role.OWNER) {
            return res.status(403).json({ error: "Only admins can update users" });
        }

        const userToUpdate = await prisma.user.findUnique({ where: { id } });
        if (!userToUpdate) return res.status(404).json({ error: "User not found" });

        const dataToUpdate = buildUpdateData(req.body, true);

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        return res.status(200).json({ message: "User updated successfully", updatedUser });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Failed to update user" });
    }
}

// Regular user updates their own profile
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(403).json({ error: "Unauthorized" });

    try {
        const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
        if (!userToUpdate) return res.status(404).json({ error: "User not found" });

        const dataToUpdate = buildUpdateData(req.body, false);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
        });

        return res.status(200).json({ message: "Profile updated successfully", updatedUser });
    } catch (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ error: "Failed to update profile" });
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