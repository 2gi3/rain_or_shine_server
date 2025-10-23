import express from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "../../middleware/auth/config.js";
// import { signup } from "../../controllers/user/signup.js";

const router = express.Router();

// router.post("/signup", signup);

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
    throw new Error("AUTH_SECRET environment variable is required");
}


// DON'T CHANGE THE ORDER OF THE ROUTES, ExpressAuth must be initialised befor the other auth routes
router.use("/", ExpressAuth(authConfig));


router.get("/csrf", (req, res) => {
    if (!req.csrfToken) {
        return res.status(500).json({ error: "CSRF not configured properly" });
    }
    const csrfToken = req.csrfToken();
    return res.json({ csrfToken });
});




export default router;
