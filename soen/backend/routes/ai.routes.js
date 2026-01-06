import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
const router = Router();

import * as authMiddleware from '../middleware/auth.middleware.js';

router.get('/get-result', authMiddleware.authUser, aiController.getResult)
router.post('/get-feedback', authMiddleware.authUser, aiController.generateCodeFeedback)
router.post('/fix-error', authMiddleware.authUser, aiController.getSmartFix)


export default router;