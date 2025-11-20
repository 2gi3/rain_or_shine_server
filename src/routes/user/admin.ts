import { Router } from "express";
import { auth } from "../../middleware/auth/auth.js";
import { createShift, getShiftsForUser } from "../../controllers/user/worker.js";

const router = Router();

router.post("/shift", auth, createShift);

router.get("shifts/:userId", auth, getShiftsForUser);

export default router;
