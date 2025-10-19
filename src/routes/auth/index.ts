import express from "express";
import { ExpressAuth } from "@auth/express";
import Resend from "@auth/core/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../prisma.js";

const router = express.Router();

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
    throw new Error("AUTH_SECRET environment variable is required");
}

// DON'T CHANGE THE ORDER OF THE ROUTES, ExpressAuth must be initialised befor the other auth routes
router.use(
    "/",
    ExpressAuth({
        providers: [
            Resend({
                apiKey: process.env.AUTH_RESEND_KEY!,
                from: "dev@peppe.uk",
            }),
        ],
        adapter: PrismaAdapter(prisma),
        secret: authSecret,
        trustHost: true,

    })
);

router.get("/csrf", (req, res) => {
    if (!req.csrfToken) {
        return res.status(500).json({ error: "CSRF not configured properly" });
    }
    const csrfToken = req.csrfToken();
    return res.json({ csrfToken });
});




export default router;
