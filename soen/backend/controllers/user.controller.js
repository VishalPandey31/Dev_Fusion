import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';
import AuditLog from '../models/audit.model.js';
import bcrypt from 'bcrypt';


export const createUserController = async (req, res) => {
    // PUBLIC REGISTRATION IS DISABLED.
    // Only Admins can add users via /admin/manage-user
    return res.status(403).json({
        error: "Public registration is disabled. Please contact an Administrator to create an account."
    });
}

export const loginController = async (req, res) => {
    console.log("Login Request Body:", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }

        // STRICT: Team Member Login cannot be used by Admins?
        // Requirement: "Separate Admin Login Page"
        // If an Admin tries to login here, we can either allow it (without admin privileges in session?) or block it.
        // Better to Block and say "Please use Admin Login".
        if (user.isAdmin) {
            return res.status(403).json({
                errors: 'Administrators must use the Admin Login page.'
            })
        }

        // STRICT: Status Check Logic
        // Case 1: Admin - Allow immediately (already checked isAdmin above, maybe?)
        // The prompt says "If role is ADMIN -> Login immediately".
        // Note: The previous block checks user.isAdmin and returns 403 "Administrators must use Admin Login page".
        // This is consistent with the requirement for separate login pages.
        // So for THIS standard login page, only MEMBERS are allowed.

        // CASE 2: Member - Pending
        if (user.status === 'PENDING') {
            return res.status(403).json({
                error: "Your request is pending admin approval. Please wait."
            });
        }

        // CASE 3: Member - Rejected
        if (user.status === 'REJECTED') {
            return res.status(403).json({
                error: "Your request has been rejected by the administrator."
            });
        }

        // CASE 4: Member - Approved
        // Proceed to password check...

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }

        const token = await user.generateJWT();

        delete user._doc.password;

        // Create Audit Log
        try {
            await AuditLog.create({
                userId: user._id,
                email: user.email,
                role: user.isAdmin ? 'Admin' : 'Member',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (logErr) {
            console.error("Audit Log creation failed:", logErr);
            // Don't block login if logging fails, but maybe alert admin?
        }

        res.status(200).json({ user, token });


    } catch (err) {

        console.log(err);

        res.status(400).send(err.message);
    }
}

export const profileController = async (req, res) => {

    const user = await userModel.findById(req.user.id);
    res.status(200).json({
        user
    });

}

export const logoutController = async (req, res) => {
    try {

        const token = req.cookies.token || req.headers.authorization.split(' ')[1];

        // redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);

        // Update Audit Log (Find latest active log for this user)
        // req.user is populated by authMiddleware
        if (req.user) {
            const userId = req.user._id || req.user.id;
            // Find most recent log without logoutTime
            const recentLog = await AuditLog.findOne({
                userId: userId,
                logoutTime: { $exists: false }
            }).sort({ loginTime: -1 });

            if (recentLog) {
                recentLog.logoutTime = new Date();
                await recentLog.save();
            }
        }

        res.status(200).json({
            message: 'Logged out successfully'
        });


    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });

        return res.status(200).json({
            users: allUsers
        })

    } catch (err) {

        console.log(err)

        res.status(400).json({ error: err.message })

    }
}

export const promoteUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isAdmin = true;
        await user.save();

        res.status(200).json({
            message: `User ${user.email} promoted to Administrator successfully`,
            user
        });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

export const adminLoginController = async (req, res) => {
    console.log("Admin Login Attempt Body:", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Admin Login Validation Errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password, adminPin } = req.body;

        const user = await userModel.findOne({ email }).select('+password +adminPin');

        if (!user) {
            return res.status(401).json({ errors: 'Invalid credentials' });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ errors: 'Access Denied: You are not an Administrator.' });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({ errors: 'Invalid credentials' });
        }

        // Verify PIN (Hashed)
        if (!user.adminPin) {
            return res.status(403).json({ errors: 'Security Alert: No Admin PIN set. Contact support.' });
        }

        const isPinMatch = await bcrypt.compare(adminPin, user.adminPin);
        if (!isPinMatch) {
            console.log(`Failed Admin Login Attempt for ${email}: Invalid PIN`);
            return res.status(401).json({ errors: 'Invalid Security PIN' });
        }

        // Verify Identity Proof Status
        if (!user.isVerifiedAdmin) {
            return res.status(403).json({ errors: 'Identity Proof Verification Pending. Access Denied.' });
        }

        const token = await user.generateJWT();
        delete user._doc.password;
        delete user._doc.adminPin;

        // Create Audit Log for Admin
        try {
            await AuditLog.create({
                userId: user._id,
                email: user.email,
                role: 'Admin',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (logErr) {
            console.error("Audit Log creation failed for Admin:", logErr);
        }

        res.status(200).json({ user, token });

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const approveUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isApproved = true;
        await user.save();
        res.status(200).json({ message: `User ${user.email} approved successfully`, user });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}
