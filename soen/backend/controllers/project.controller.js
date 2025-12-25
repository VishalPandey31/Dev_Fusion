import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import sessionModel from '../models/session.model.js';
import { validationResult } from 'express-validator';

// ===============================
// CREATE PROJECT
// ===============================
export const createProject = async (req, res) => {

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;

        // User already available from auth middleware = req.user
        const userId = req.user.id;

        const newProject = await projectService.createProject({ name, userId });

        return res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};

// ===============================
// GET ALL PROJECTS OF LOGGED USER
// ===============================
export const getAllProject = async (req, res) => {
    try {

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: req.user.id
        });

        return res.status(200).json({
            projects: allUserProjects
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};

// ===============================
// ADD USER(S) TO A PROJECT
// ===============================
export const addUserToProject = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users } = req.body;

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: req.user.id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};

// ===============================
// GET SINGLE PROJECT BY ID
// ===============================
export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await projectService.getProjectById({ projectId });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};

// ===============================
// UPDATE FILE TREE
// ===============================
export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, fileTree } = req.body;

        const project = await projectService.updateFileTree({
            projectId,
            fileTree,
            userId: req.user.id
        });

        return res.status(200).json({
            project
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
}

// ===============================
// INVITE MEMBER (CREATE + ADD TO PENDING)
// ===============================
export const inviteMemberController = async (req, res) => {
    try {
        const { projectId, email, password } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Email and Password required" });

        // 1. Create User (if not exists)
        let user = await userModel.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists. Cannot re-create." });

        const hashedPassword = await userModel.hashPassword(password);
        user = await userModel.create({
            email,
            password: hashedPassword,
            isApproved: false, // Legacy field
            status: 'PENDING', // New Strict Field
            isAdmin: false
        });

        // 2. Add to Project Pending List
        const project = await projectModel.findById(projectId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        // Check if already in users or pending
        if (project.users.includes(user._id)) return res.status(400).json({ error: "User already in project" });
        if (project.pendingUsers.includes(user._id)) return res.status(400).json({ error: "User already pending" });

        project.pendingUsers.push(user._id);
        console.log(`[DEBUG] Added user ${user._id} to pendingUsers of project ${project._id}`);
        console.log(`[DEBUG] Pending Users before save:`, project.pendingUsers);

        await project.save();
        console.log(`[DEBUG] Project saved successfully`);

        res.status(201).json({ message: "User created and invite sent", user, project });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// APPROVE JOIN REQUEST
// ===============================
export const approveJoinRequestController = async (req, res) => {
    try {
        const { projectId, userId, action } = req.body; // action: 'accept' or 'reject'

        const project = await projectModel.findById(projectId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        if (!project.pendingUsers.includes(userId)) return res.status(404).json({ error: "Request not found (or user already removed)" });

        // Remove from pending
        project.pendingUsers = project.pendingUsers.filter(id => id.toString() !== userId);

        if (action === 'accept') {
            if (!project.users.includes(userId)) {
                project.users.push(userId);
            }
            // STRICT: Update Global User Status to APPROVED
            await userModel.findByIdAndUpdate(userId, { status: 'APPROVED', isApproved: true });
        } else {
            // STRICT: Update Global User Status to REJECTED
            await userModel.findByIdAndUpdate(userId, { status: 'REJECTED', isApproved: false });
        }

        await project.save();

        // Return updated project with populated fields
        const updatedProject = await projectModel.findById(projectId)
            .populate('users')
            .populate('pendingUsers');

        res.status(200).json({ message: `Request ${action}ed`, project: updatedProject });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// REMOVE USER FROM PROJECT
// ===============================
export const removeUserFromProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, userId } = req.body;

        // Verify if the requester is the owner of the project
        const project = await projectService.getProjectById({ projectId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Admin check is handled by middleware
        // if (project.owner.toString() !== req.user.id) {
        //     return res.status(403).json({ error: 'Only the project owner can remove users' });
        // }

        const updatedProject = await projectService.removeUserFromProject({
            projectId,
            userId
        });

        return res.status(200).json({ project: updatedProject });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ===============================
// GET PROJECT STATS
// ===============================
export const getProjectStats = async (req, res) => {
    try {
        const { projectId } = req.params;

        const stats = await projectService.getProjectStats({
            projectId
        });

        return res.status(200).json({
            stats
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};

export const getProjectMessages = async (req, res) => {
    try {
        const { projectId } = req.params;

        const messages = await projectService.getProjectMessages({
            projectId
        });

        return res.status(200).json({
            messages
        });

    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};