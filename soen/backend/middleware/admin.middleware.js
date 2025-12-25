import userModel from '../models/user.model.js';

export const checkAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await userModel.findOne({ email: req.user.email });

        if (!user || user.isAdmin !== true) {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error checking admin permissions" });
    }
};
