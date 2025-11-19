import { createShift } from '../../controllers/user/worker.js';
import { auth } from '../../middleware/auth/auth.js';
import { Router } from 'express';

const router = Router();

router.post("/shift", auth, createShift);

export default router;