const express = require('express');
const { db } = require('../config/database');
const { logger } = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive analytics
router.get('/comprehensive', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Get transaction statistics
    const transactionStats = await db('transactions')
        .where('user_id', userId)
        .whereBetween('transaction_date', [start, end])
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
            period: { start, end },
            transactionStats: {
                totalTransactions: parseInt(transactionStats.total_transactions) || 0,
                totalReceived: parseFloat(transactionStats.total_received) || 0,
                totalSent: parseFloat(transactionStats.total_sent) || 0,
                averageAmount: parseFloat(transactionStats.average_amount) || 0
            }
        }
    });
}));

module.exports = router;
