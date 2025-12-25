import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true
    },
    sender: {
        type: Object, // Stores { _id: 'ai' | userid, email: ... } directly
        required: true
    },
    message: {
        type: String, // Storing JSON string for AI messages sometimes? No, usually text. Frontend parses it.
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('message', messageSchema);

export default Message;
