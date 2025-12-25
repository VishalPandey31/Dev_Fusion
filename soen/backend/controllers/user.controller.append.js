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
