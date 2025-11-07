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
        // 1️⃣ Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found. Please sign up first." });
        }

        // 2️⃣ Verify OTP
        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // 3️⃣ Mark user as verified if not already
        if (!user.emailVerified) {
            await prisma.user.update({
                where: { email },
                data: { emailVerified: new Date() },
            });
        }

        // 4️⃣ Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: "7d" } // adjustable
        );

        // 5️⃣ Optionally set cookie (secure in production)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // 6️⃣ Respond with token + user data
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Something went wrong." });
    }
}

// import type { Request, Response } from "express";
// import { prisma } from "../../prisma.js";

// export async function verifyEmail(req: Request, res: Response) {
//     const { token, email } = req.query;

//     if (!token || !email || typeof token !== "string" || typeof email !== "string") {
//         return res.status(400).json({ error: "Invalid verification link." });
//     }

//     try {
//         const record = await prisma.verificationToken.findUnique({
//             where: { identifier_token: { identifier: email, token } },
//         });

//         if (!record || record.expires < new Date()) {
//             return res.status(400).json({ error: "Token expired or invalid." });
//         }

//         // Mark user as verified
//         await prisma.user.update({
//             where: { email },
//             data: { emailVerified: new Date() },
//         });

//         // Clean up used token
//         await prisma.verificationToken.delete({
//             where: { identifier_token: { identifier: email, token } },
//         });

//         // ✅ Redirect to Auth.js sign-in page with email prefilled
//         return res.redirect(`/auth/signin?email=${encodeURIComponent(email)}`);
//     } catch (error) {
//         console.error("Verify error:", error);
//         return res.status(500).json({ error: "Failed to verify email." });
//     }
// }
