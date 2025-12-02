import crypto from "crypto";
import { prisma } from "../prisma.js";
import type { Email, OTP } from "../types/common.js";

/**
 * Generate and store a new OTP for an email
 */
export async function generateOTP(email: any, expiryMinutes = 15) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Remove any previous OTPs for that email
    await prisma.verificationToken.deleteMany({
        where: { identifier: email },
    });

    // Store new OTP
    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token: otp,
            expires,
        },
    });

    return otp;
}

/**
 * Verify an OTP for an email
 */
export async function verifyOTP(email: Email, otp: OTP) {
    const record = await prisma.verificationToken.findUnique({
        where: {
            identifier_token: {
                identifier: email,
                token: otp,
            },
        },
    });

    if (!record || record.expires < new Date()) {
        return false;
    }

    // Delete OTP after successful use
    await prisma.verificationToken.delete({
        where: {
            identifier_token: {
                identifier: email,
                token: otp,
            },
        },
    });

    return true;
}
