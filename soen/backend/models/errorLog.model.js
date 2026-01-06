import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema({
    errorMessage: {
        type: String,
        required: true,
        trim: true,
        index: true // Enable faster searching
    },
    fixSuggestion: {
        type: String,
        required: true
    },
    frequency: {
        type: Number,
        default: 1
    },
    language: {
        type: String,
        default: 'English',
        index: true
    },
    lastOccurred: {
        type: Date,
        default: Date.now
    }
});

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

export default ErrorLog;
