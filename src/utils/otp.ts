import crypto from "crypto";
import { prisma } from "../prisma.js";
import type { Email, OTP } from "../types/common.js";


export async function generateOTP(email: any, expiryMinutes = 15) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await prisma.verificationToken.deleteMany({
        where: { identifier: email },
    });

    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token: otp,
            expires,
        },
    });

    return otp;
}


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
