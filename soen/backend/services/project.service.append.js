
export const removeUserFromProject = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }
    if (!userId) {
        throw new Error("userId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }

    const project = await projectModel.findOne({
        _id: projectId
    })

    if (!project) {
        throw new Error("Project not found")
    }

    // Check if user is being removed is the owner
    if (project.owner.toString() === userId) {
        throw new Error("Cannot remove project owner")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $pull: {
            users: userId
        }
    }, {
        new: true
    })

    return updatedProject
}
