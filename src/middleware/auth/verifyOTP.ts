// src/middleware/verifyOtp.ts
import type { Request, Response, NextFunction } from "express";
import { verifyOTP } from "../../utils/otp.js";
import type { OtpRequestBody } from "../../types/user/index.js";

export async function verifyOtpMiddleware(
    req: Request<{}, {}, OtpRequestBody>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ error: "Email and OTP are required." });
            return;
        }

        const valid = await verifyOTP(email, otp);

        if (!valid) {
            res.status(400).json({ error: "Invalid or expired OTP." });
            return;
        }

        next();
    } catch (err) {
        console.error("OTP verification error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
}
