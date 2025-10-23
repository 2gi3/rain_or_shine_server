import express from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "../../middleware/auth/config.js";
import verifyRoute from "./verify.js";

const router = express.Router();

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) throw new Error("AUTH_SECRET environment variable is required");

// Initialize ExpressAuth first
router.use("/", ExpressAuth(authConfig));

// CSRF route
router.get("/csrf", (req, res) => {
    if (!req.csrfToken) return res.status(500).json({ error: "CSRF not configured properly" });
    return res.json({ csrfToken: req.csrfToken() });
});

// Mount verify route
router.use("/verify", verifyRoute);

export default router;
