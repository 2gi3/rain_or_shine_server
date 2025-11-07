import type { Request } from "express";
import type { Email, OTP } from "../common.js";

export interface AuthUser {
    id?: string | null;
    email?: Email | null;
    name?: string | null;
    image?: string | null;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

export interface OtpRequestBody {
    email: Email;
    otp: OTP;
}
