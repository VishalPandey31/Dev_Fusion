import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    loginTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    logoutTime: {
        type: Date
    },
    duration: {
        type: Number, // In seconds
        default: 0
    }
});

const Session = mongoose.model('session', sessionSchema);

export default Session;
