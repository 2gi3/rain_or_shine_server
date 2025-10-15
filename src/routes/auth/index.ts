import express from "express";
import { ExpressAuth } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../prisma.js";

const router = express.Router();

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
    throw new Error("AUTH_SECRET environment variable is required");
}

router.use(
    "/",
    ExpressAuth({
        providers: [],
        adapter: PrismaAdapter(prisma),
        secret: authSecret,
    })
);

export default router;
