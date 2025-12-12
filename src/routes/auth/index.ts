import express from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "../../middleware/auth/config.js";
// import verifyRoute from "./verify.js";
import { verifyEmail } from "@/controllers/auth/index.js";

const router = express.Router();

router.use("/verify", verifyEmail);

router.use("/", ExpressAuth(authConfig));

router.get("/csrf", (req, res) => {
    if (!req.csrfToken) return res.status(500).json({ error: "CSRF not configured properly" });
    return res.json({ csrfToken: req.csrfToken() });
});


export default router;
