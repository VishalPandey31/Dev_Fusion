import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String, // 'Admin' or 'Member'
        default: 'Member'
    },
    loginTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    logoutTime: {
        type: Date
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
});

const AuditLog = mongoose.model('auditLog', auditSchema);

export default AuditLog;
