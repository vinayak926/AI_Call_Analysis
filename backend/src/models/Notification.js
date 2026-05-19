const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['hot_lead', 'follow_up', 'poor_performance'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    audioRecordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioRecording' },
    studentName: { type: String, default: null },
    counsellorName: { type: String, default: null },
    leadScore: { type: Number, default: null },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
