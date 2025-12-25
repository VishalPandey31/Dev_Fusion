import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';
import sessionModel from '../models/session.model.js';
import messageModel from '../models/message.model.js';

export const createProject = async ({
    name, userId
}) => {
    if (!name) {
        throw new Error('Name is required')
    }
    if (!userId) {
        throw new Error('UserId is required')
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [userId],
            owner: userId
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;

}


export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    const allUserProjects = await projectModel.find({
        users: userId
    })

    return allUserProjects
}

export const addUsersToProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }


    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    console.log(project)

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject



}

export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users').populate('pendingUsers')

    return project;
}

export const updateFileTree = async ({ projectId, fileTree }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!fileTree) {
        throw new Error("fileTree is required")
    }

    const project = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        fileTree
    }, {
        new: true
    })

    return project;
}

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
    // Note: We might want to pass the requesting user's ID to verify they are the owner too, 
    // but the controller handles the "caller must be owner" check, or we do it here.
    // The requirement says "Administrator" role restriction. 
    // Usually the service should handle business logic. 
    // Let's rely on the controller passing the requesterId to verify ownership permission if needed, 
    // OR we just assume the controller authorizes the action.
    // For now, let's just implement the removal logic. The Controller will ensure the *requester* is the owner.
    // The service ensures we don't remove the *owner* themselves.

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

export const getProjectStats = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    const sessions = await sessionModel.find({
        projectId
    }).populate('userId');

    const stats = {};

    sessions.forEach(session => {
        if (!session.userId) return; // Skip if user deleted or not populated
        const email = session.userId.email;
        if (!stats[email]) {
            stats[email] = {
                logins: 0,
                totalDuration: 0
            }
        }
        stats[email].logins += 1;
        stats[email].totalDuration += session.duration || 0;
    });

    return stats;
}

export const getProjectMessages = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    const messages = await messageModel.find({
        projectId
    }).sort({ timestamp: 1 });

    return messages;
}