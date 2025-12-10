import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";
import { verifyOTP } from "../../utils/otp.js";
import { ENV } from "../../env.js";

const JWT_SECRET = ENV.JWT_SECRET!;

export async function login(req: Request, res: Response) {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                shifts: true,
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found. Please sign up first." });
        }

        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        if (!user.emailVerified) {
            await prisma.user.update({
                where: { email },
                data: { emailVerified: new Date() },
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            message: "Login successful",
            token,
            user
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Something went wrong." });
    }
}
