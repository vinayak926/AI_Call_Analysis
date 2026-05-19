const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// GET /api/notifications — last 50, admin only
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        const unreadCount = await Notification.countDocuments({ isRead: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// PATCH /api/notifications/read-all — must be before /:id route
router.patch('/read-all', protect, adminOnly, async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, adminOnly, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
