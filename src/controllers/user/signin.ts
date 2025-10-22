import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";

export async function verifyEmail(req: Request, res: Response) {
    const { token, email } = req.query;

    if (!token || !email || typeof token !== "string" || typeof email !== "string") {
        return res.status(400).json({ error: "Invalid verification link." });
    }

    try {
        const record = await prisma.verificationToken.findUnique({
            where: { identifier_token: { identifier: email, token } },
        });

        if (!record || record.expires < new Date()) {
            return res.status(400).json({ error: "Token expired or invalid." });
        }

        // Mark user as verified
        await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() },
        });

        // Clean up used token
        await prisma.verificationToken.delete({
            where: { identifier_token: { identifier: email, token } },
        });

        // ✅ Redirect to Auth.js sign-in page with email prefilled
        return res.redirect(`/auth/signin?email=${encodeURIComponent(email)}`);
    } catch (error) {
        console.error("Verify error:", error);
        return res.status(500).json({ error: "Failed to verify email." });
    }
}
