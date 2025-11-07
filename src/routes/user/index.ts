import { signup } from '../../controllers/user/signup.js';
import { deleteUser, getAllUsers } from '../../controllers/user/index.js';
import { login } from '../../controllers/user/login.js';
import { auth } from '../../middleware/auth/auth.js';
import express, { Router } from 'express';
import { requestOtp } from '../../controllers/auth/index.js';
// import type { RequestHandler } from 'express';

const router: Router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/request-otp", requestOtp)

// router.get("/verify", verifyEmail as RequestHandler);

router.get("/me", auth, (req, res) => {
    res.json({ user: (req as any).user });
});

router.get("/all", getAllUsers);
router.get("/all_auth", auth, getAllUsers);
router.delete("/delete/:id", deleteUser);



export default router;