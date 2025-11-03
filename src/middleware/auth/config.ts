import { PrismaAdapter } from "@auth/prisma-adapter";
import { ENV } from "../../env.js";
import Resend from "@auth/core/providers/resend";
import type { ExpressAuthConfig } from "@auth/express";
import { prisma } from "../../prisma.js";

const authSecret = ENV.AUTH_SECRET;
const authResendKey = ENV.AUTH_RESEND_KEY

export const authConfig: ExpressAuthConfig = {
    providers: [
        Resend({
            apiKey: authResendKey,
            from: "dev@peppe.uk",
        }),
    ],
    adapter: PrismaAdapter(prisma),
    secret: authSecret,
    trustHost: true,
    cookies: {
        csrfToken: {
            name: "__Host-authjs.csrf-token",
            options: {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                path: "/",
            },
        },
        sessionToken: {
            name: "__Secure-authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                path: "/",
            },
        },
    },
    pages: {
        signIn: "/auth/signin",
        verifyRequest: "/auth/verify-email",
    },
};
