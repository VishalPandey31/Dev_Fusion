import userModel from '../models/user.model.js';
import AuditLog from '../models/audit.model.js';

export const getDashboardStatsController = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments();
        const activeUsers = await userModel.countDocuments({ isApproved: true });
        const pendingUsers = await userModel.countDocuments({ isApproved: false }); // Assuming false is pending
        // Or if 'isApproved' defaults to false for members

        const recentLogs = await AuditLog.find().sort({ loginTime: -1 }).limit(10);

        res.status(200).json({
            stats: {
                totalUsers,
                activeUsers,
                pendingUsers
            },
            recentLogs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllLogsController = async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ loginTime: -1 });
        res.status(200).json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const manageUserController = async (req, res) => {
    try {
        const { userId, action, email, password } = req.body; // action: 'approve', 'revoke', 'remove', 'create'

        if (action === 'create') {
            if (!email || !password) return res.status(400).json({ error: "Email and Password required" });

            const existing = await userModel.findOne({ email });
            if (existing) return res.status(400).json({ error: "User already exists" });

            const hashedPassword = await userModel.hashPassword(password);

            const user = await userModel.create({
                email,
                password: hashedPassword,
                isApproved: true, // Created by admin = approved
                isAdmin: false
            });
            return res.status(201).json({ message: "User created successfully", user });
        }

        if (!userId) return res.status(400).json({ error: "User ID required" });

        if (action === 'remove') {
            await userModel.findByIdAndDelete(userId);
            return res.status(200).json({ message: 'User removed successfully' });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isAdmin) return res.status(403).json({ error: "Cannot modify other Admins via this panel" });

        if (action === 'approve') {
            user.isApproved = true;
        } else if (action === 'revoke' || action === 'block') {
            user.isApproved = false;
        }

        await user.save();
        res.status(200).json({ message: `User access ${action === 'revoke' || action === 'block' ? 'revoked' : 'granted'} successfully`, user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
