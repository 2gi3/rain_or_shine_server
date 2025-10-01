import { createUser, getAllUsers } from '../../controllers/user/index.js';
import express, { Router } from 'express';
import type { RequestHandler } from 'express';

const router: Router = express.Router();
router.post('/signup', createUser as RequestHandler)
router.get('/', getAllUsers as RequestHandler)

export default router;