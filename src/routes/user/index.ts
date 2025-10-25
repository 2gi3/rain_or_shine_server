import { getAllUsers } from '../../controllers/user/index.js';
import { verifyEmail } from '../../controllers/user/signin.js';
import { auth } from '../../middleware/auth/auth.js';
import express, { Router } from 'express';
import type { RequestHandler } from 'express';

const router: Router = express.Router();

router.get("/verify", verifyEmail as RequestHandler);

router.get("/me", auth, (req, res) => {
    res.json({ user: (req as any).user });
});

router.get("/all", getAllUsers);


export default router;