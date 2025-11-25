import { signup } from '../../controllers/user/signup.js';
import { deleteUser, getAllUsers, updateProfile } from '../../controllers/user/index.js';
import { login } from '../../controllers/user/login.js';
import { auth } from '../../middleware/auth/auth.js';
import express, { Router } from 'express';
import { requestOtp } from '../../controllers/auth/index.js';

const router: Router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/request-otp", requestOtp)


router.get("/me", auth, (req, res) => {
    res.json({ user: (req as any).user });
});
router.put("/me", auth, updateProfile);

router.get("/all", getAllUsers);
router.delete("/delete/:id", deleteUser);



export default router;