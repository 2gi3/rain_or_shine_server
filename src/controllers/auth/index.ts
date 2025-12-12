import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { generateOTP } from "../../utils/otp.js";
import { Resend } from "resend";
import { ENV } from "../../env.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = ENV.JWT_SECRET!;
const CLIENT_URL = ENV.CLIENT_URL;
const resend = new Resend(ENV.AUTH_RESEND_KEY!);

export async function requestOtp(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found. Please sign up first." });
        }

        const otp = await generateOTP(email);
        console.log({ 'one time password': otp })

        await resend.emails.send({
            from: "dev@peppe.uk",
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






export async function verifyEmail(req: Request, res: Response) {
    try {
        const email = req.query.email as string | undefined;
        const token = req.query.token as string | undefined;

        if (!email || !token) {
            return res.status(400).send("Missing token or email");
        }

        const where = {
            identifier_token: { identifier: email, token },
        };

        const record = await prisma.verificationToken.findUnique({ where });

        if (!record || record.expires < new Date()) {
            return res.status(400).send("Invalid or expired verification token.");
        }

        const user = await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() },
        });

        await prisma.verificationToken.delete({ where });

        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.redirect(302, `${CLIENT_URL}?token=${jwtToken}`);
    } catch (error) {
        console.error("Error during email verification:", error);
        return res.status(500).send("Internal server error");
    }
}
