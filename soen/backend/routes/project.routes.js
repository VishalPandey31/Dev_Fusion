import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';
import { checkAdmin } from '../middleware/admin.middleware.js';

const router = Router();

router.post(
    '/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProject
);

router.get(
    '/all',
    authMiddleWare.authUser,
    projectController.getAllProject
);

router.put(
    '/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users')
        .isArray({ min: 1 })
        .withMessage('Users must be an array')
        .custom((users) => users.every((u) => typeof u === 'string'))
        .withMessage('Each user must be a string'),
    checkAdmin,
    projectController.addUserToProject
);

router.get(
    '/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById
);

router.post(
    '/invite-member',
    authMiddleWare.authUser,
    checkAdmin,
    body('projectId').isString(),
    body('email').isEmail(),
    body('password').isString(),
    projectController.inviteMemberController
);

router.put(
    '/approve-request',
    authMiddleWare.authUser,
    checkAdmin,
    body('projectId').isString(),
    body('userId').isString(),
    body('action').isIn(['accept', 'reject']),
    projectController.approveJoinRequestController
);

router.put(
    '/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
);

router.put(
    '/remove-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('userId').isString().withMessage('User ID is required'),
    checkAdmin,
    projectController.removeUserFromProject
);



router.get(
    '/get-stats/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectStats
);

router.get(
    '/get-messages/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectMessages
)

export default router;
