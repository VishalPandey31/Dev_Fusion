import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { body } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';
import * as adminMiddleware from '../middleware/admin.middleware.js';

const router = Router();




router.post('/register',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.createUserController);

router.post('/login',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.loginController);

router.post('/admin-login',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    body('adminPin').isLength({ min: 8, max: 8 }).withMessage('Admin PIN must be 8 digits'),
    userController.adminLoginController);

router.get('/profile', authMiddleware.authUser, userController.profileController);


router.get('/logout', authMiddleware.authUser, userController.logoutController);


router.get('/all', authMiddleware.authUser, userController.getAllUsersController);

router.put('/promote',
    authMiddleware.authUser,
    adminMiddleware.checkAdmin,
    body('userId').isString().withMessage('User ID is required'),
    userController.promoteUserController
);

router.put('/approve',
    authMiddleware.authUser,
    adminMiddleware.checkAdmin,
    body('userId').isString().withMessage('User ID is required'),
    userController.approveUserController
);


export default router;
