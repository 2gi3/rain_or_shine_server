import { Router } from "express";
import { auth } from "../../middleware/auth/auth.js";
import { createShift, getShiftsForUser, updateShift } from "../../controllers/user/worker.js";

const router = Router();

router.post("/shift", auth, createShift);
router.get("/shifts", auth, getShiftsForUser);
router.put("/shift/:shiftId", auth, updateShift);

export default router;
