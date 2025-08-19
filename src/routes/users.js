const express = require('express');
const { db } = require('../config/database');
const { logger } = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
    const user = await db('users')
        .where('id', req.user.id)
        .select([
            'id', 'email', 'business_name', 'phone_number', 'business_type', 
            'location', 'is_verified', 'business_settings', 'voice_preferences',
            'created_at', 'last_login_at'
        ])
        .first();

    res.json({
        success: true,
        data: {
            user: {
                ...user,
                business_settings: JSON.parse(user.business_settings || '{}'),
                voice_preferences: JSON.parse(user.voice_preferences || '{}')
            }
        }
    });
}));

module.exports = router;
