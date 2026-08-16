import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true
    },
    sender: {
        type: Object,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: null
    },
    deletedForEveryone: {
        type: Boolean,
        default: false
    },
    deletedFor: {
        type: [String], // array of user IDs who deleted "for me"
        default: []
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('message', messageSchema);

export default Message;
