import { Router } from "express";
import { auth } from "../../middleware/auth/auth.js";
import { createShift, getShiftsForUser, updateShift } from "../../controllers/user/worker.js";
import { updateUser } from "@/controllers/user/index.js";

const router = Router();

router.post("/shift", auth, createShift);
router.get("shifts/:userId", auth, getShiftsForUser);
router.put("/shift/:shiftId", auth, updateShift);
router.put("/user/:id", auth, updateUser);

export default router;
