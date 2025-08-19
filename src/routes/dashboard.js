const express = require('express');
const { db } = require('../config/database');
const { logger } = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period = 'today' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            endDate = now;
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            endDate = now;
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    // Get transaction statistics
    const transactionStats = await db('transactions')
        .where('user_id', userId)
        .whereBetween('transaction_date', [startDate, endDate])
        .select(
            db.raw('COUNT(*) as total_transactions'),
            db.raw('SUM(CASE WHEN transaction_type = \'received\' THEN amount ELSE 0 END) as total_received'),
            db.raw('SUM(CASE WHEN transaction_type = \'sent\' THEN amount ELSE 0 END) as total_sent'),
            db.raw('AVG(amount) as average_amount')
        )
        .first();

    res.json({
        success: true,
        data: {
            period,
            dateRange: { start: startDate, end: endDate },
            overview: {
                totalTransactions: parseInt(transactionStats.total_transactions) || 0,
                totalReceived: parseFloat(transactionStats.total_received) || 0,
                totalSent: parseFloat(transactionStats.total_sent) || 0,
                netAmount: (parseFloat(transactionStats.total_received) || 0) - (parseFloat(transactionStats.total_sent) || 0),
                averageAmount: parseFloat(transactionStats.average_amount) || 0
            }
        }
    });
}));

module.exports = router;
