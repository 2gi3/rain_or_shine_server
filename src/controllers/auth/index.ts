import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { generateOTP } from "../../utils/otp.js";
import { Resend } from "resend";
import { ENV } from "../../env.js";

const resend = new Resend(ENV.AUTH_RESEND_KEY!);

export async function requestOtp(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found. Please sign up first." });
        }

        // Generate OTP
        const otp = await generateOTP(email);
        console.log({ 'one time password': otp })
        // Send OTP email
        await resend.emails.send({
            from: "dev@peppe.uk", // ✅ use the same sender as signup
            to: email,
            subject: "Thank you for trying my app, this is the verification code",
            html: `
        <p>Hi ${user.name || "there"},</p>
        <p>Your verification code is:</p>
        <h2>${otp}</h2>
        <p>This code expires in 15 minutes.</p>
      `,
        });

        return res.status(200).json({
            message: "Verification code sent to email.",
            email,
        });
    } catch (error) {
        console.error("Error generating OTP:", error);
        return res.status(500).json({ error: "Failed to send OTP email." });
    }
}
