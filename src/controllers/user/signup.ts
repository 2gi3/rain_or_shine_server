import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { ENV } from "../../env.js";
import { Resend } from "resend";
import { generateOTP } from "../../utils/otp.js";

const resend = new Resend(ENV.AUTH_RESEND_KEY!);

export async function signup(req: Request, res: Response) {
    const { name, email } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: "Name and email are required." });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.emailVerified) {
            return res.status(409).json({ error: "User already exists and is verified." });
        }

        const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: { name, email },
        });

        const otp = await generateOTP(email);

        await resend.emails.send({
            from: "dev@peppe.uk",
            to: email,
            subject: "Your Rain or Shine verification code",
            html: `
        <p>Hi ${name || "there"},</p>
        <p>Your verification code is:</p>
        <h2>${otp}</h2>
        <p>This code expires in 15 minutes.</p>
      `,
        });

        console.log({ otp })

        return res.status(200).json({
            message: "Verification code sent to email.",
            user,
        });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ error: "Something went wrong." });
    }
}

