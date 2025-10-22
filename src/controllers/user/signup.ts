import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.AUTH_RESEND_KEY!);
const BASE_URL = process.env.BASE_URL || "https://your-domain.com";

export async function signup(req: Request, res: Response) {
    const { name, email } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: "Name and email are required." });
    }

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.emailVerified) {
            return res.status(409).json({ error: "User already exists and is verified." });
        }

        // Create or update the user
        const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: { name, email },
        });

        // Create a verification token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        // Send the magic link email
        const verifyUrl = `${BASE_URL}/auth/verify?token=${token}&email=${email}`;
        await resend.emails.send({
            from: "dev@peppe.uk",
            to: email,
            subject: "Verify your email",
            html: `
        <p>Hi ${name || "there"},</p>
        <p>Click below to verify your email and finish signing up:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in 15 minutes.</p>
      `,
        });

        return res.status(200).json({
            message: "Verification email sent.",
            user
        });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ error: "Something went wrong." });
    }
}
