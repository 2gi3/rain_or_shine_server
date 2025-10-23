import { verifyEmail } from '../../controllers/user/signin.js';
import { auth } from '../../middleware/auth/auth.js';
import express, { Router } from 'express';
import type { RequestHandler } from 'express';

const router: Router = express.Router();
// router.post('/signup', createUser as RequestHandler)
// router.get('/', getAllUsers as RequestHandler)

// router.post("/signup", signup as RequestHandler);
router.get("/verify", verifyEmail as RequestHandler);

router.get("/me", auth, (req, res) => {
    res.json({ user: (req as any).user });
});

export default router;