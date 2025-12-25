import { Router } from 'express';
import { registerAdminController } from '../controllers/admin.controller.js';
import { getDashboardStatsController, getAllLogsController, manageUserController } from '../controllers/admin.dashboard.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { checkAdmin } from '../middleware/admin.middleware.js';

const router = Router();

router.post('/register', upload.single('identityProof'), registerAdminController);

// Dashboard Routes (Protected)
router.get('/dashboard-stats', authMiddleware.authUser, checkAdmin, getDashboardStatsController);
router.get('/audit-logs', authMiddleware.authUser, checkAdmin, getAllLogsController);
router.put('/manage-user', authMiddleware.authUser, checkAdmin, manageUserController);

export default router;
