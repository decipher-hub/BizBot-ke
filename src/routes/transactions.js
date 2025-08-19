const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { logger } = require('../utils/logger');
const { parseMPESASMS } = require('../services/mpesaParser');
const { categorizeTransaction } = require('../services/aiCategorizer');
const { generateInsights } = require('../services/analyticsEngine');

// Get all transactions for a user
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, startDate, endDate, search } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        let query = db('transactions')
            .where('user_id', userId)
            .orderBy('transaction_date', 'desc');

        // Apply filters
        if (category) {
            query = query.where('category', category);
        }

        if (startDate && endDate) {
            query = query.whereBetween('transaction_date', [startDate, endDate]);
        }

        if (search) {
            query = query.where(function() {
                this.where('sender_name', 'ilike', `%${search}%`)
                    .orWhere('recipient_name', 'ilike', `%${search}%`)
                    .orWhere('mpesa_transaction_id', 'ilike', `%${search}%`);
            });
        }

        const transactions = await query
            .limit(limit)
            .offset(offset);

        const total = await db('transactions')
            .where('user_id', userId)
            .count('* as count')
            .first();

        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total.count),
                pages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const transaction = await db('transactions')
            .where({ id, user_id: userId })
            .first();

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        logger.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// Add new transaction (manual entry)
router.post('/', [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('transaction_type').isIn(['received', 'sent', 'withdrawal', 'deposit']).withMessage('Invalid transaction type'),
    body('sender_name').optional().isString(),
    body('sender_phone').optional().isString(),
    body('category').optional().isString(),
    body('transaction_date').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;
        const transactionData = {
            ...req.body,
            user_id: userId,
            transaction_date: req.body.transaction_date || new Date(),
            is_processed: true
        };

        // Generate MPESA transaction ID if not provided
        if (!transactionData.mpesa_transaction_id) {
            transactionData.mpesa_transaction_id = `MANUAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Categorize transaction using AI
        const category = await categorizeTransaction(transactionData);
        transactionData.category = category;

        // Generate AI insights
        const insights = await generateInsights(transactionData);
        transactionData.ai_insights = insights;

        const [transaction] = await db('transactions')
            .insert(transactionData)
            .returning('*');

        logger.info(`Transaction created: ${transaction.id}`);
        res.status(201).json(transaction);
    } catch (error) {
        logger.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// Process MPESA SMS
router.post('/process-sms', [
    body('sms_content').isString().notEmpty().withMessage('SMS content is required'),
    body('phone_number').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;
        const { sms_content, phone_number } = req.body;

        // Parse MPESA SMS
        const parsedData = await parseMPESASMS(sms_content);
        
        if (!parsedData.isValid) {
            return res.status(400).json({ 
                error: 'Invalid MPESA SMS format',
                details: parsedData.errors 
            });
        }

        // Check if transaction already exists
        const existingTransaction = await db('transactions')
            .where({ 
                mpesa_transaction_id: parsedData.transaction_id,
                user_id: userId 
            })
            .first();

        if (existingTransaction) {
            return res.status(409).json({ 
                error: 'Transaction already exists',
                transaction: existingTransaction 
            });
        }

        // Prepare transaction data
        const transactionData = {
            user_id: userId,
            mpesa_transaction_id: parsedData.transaction_id,
            amount: parsedData.amount,
            transaction_type: parsedData.type,
            sender_name: parsedData.sender_name,
            sender_phone: parsedData.sender_phone,
            recipient_name: parsedData.recipient_name,
            recipient_phone: parsedData.recipient_phone,
            account_number: parsedData.account_number,
            business_short_code: parsedData.business_short_code,
            invoice_number: parsedData.invoice_number,
            org_account_balance: parsedData.org_account_balance,
            middleware: parsedData.middleware,
            sms_content: sms_content,
            parsed_data: parsedData,
            transaction_date: parsedData.transaction_date || new Date(),
            is_processed: false
        };

        // Categorize transaction using AI
        const category = await categorizeTransaction(transactionData);
        transactionData.category = category;

        // Generate AI insights
        const insights = await generateInsights(transactionData);
        transactionData.ai_insights = insights;
        transactionData.is_processed = true;

        const [transaction] = await db('transactions')
            .insert(transactionData)
            .returning('*');

        logger.info(`MPESA transaction processed: ${transaction.id}`);
        res.status(201).json(transaction);
    } catch (error) {
        logger.error('Error processing MPESA SMS:', error);
        res.status(500).json({ error: 'Failed to process MPESA SMS' });
    }
});

// Update transaction
router.put('/:id', [
    body('category').optional().isString(),
    body('subcategory').optional().isString(),
    body('sender_name').optional().isString(),
    body('recipient_name').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;

        // Check if transaction exists and belongs to user
        const existingTransaction = await db('transactions')
            .where({ id, user_id: userId })
            .first();

        if (!existingTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update transaction
        const [updatedTransaction] = await db('transactions')
            .where({ id, user_id: userId })
            .update({
                ...updateData,
                updated_at: new Date()
            })
            .returning('*');

        logger.info(`Transaction updated: ${id}`);
        res.json(updatedTransaction);
    } catch (error) {
        logger.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deletedCount = await db('transactions')
            .where({ id, user_id: userId })
            .del();

        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        logger.info(`Transaction deleted: ${id}`);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        logger.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = { transaction_date: [startDate, endDate] };
        }

        // Get basic statistics
        const stats = await db('transactions')
            .where('user_id', userId)
            .modify(function(queryBuilder) {
                if (startDate && endDate) {
                    queryBuilder.whereBetween('transaction_date', [startDate, endDate]);
                }
            })
            .select(
                db.raw('COUNT(*) as total_transactions'),
                db.raw('SUM(CASE WHEN transaction_type = \'received\' THEN amount ELSE 0 END) as total_received'),
                db.raw('SUM(CASE WHEN transaction_type = \'sent\' THEN amount ELSE 0 END) as total_sent'),
                db.raw('AVG(amount) as average_amount'),
                db.raw('MAX(amount) as highest_amount'),
                db.raw('MIN(amount) as lowest_amount')
            )
            .first();

        // Get category breakdown
        const categoryStats = await db('transactions')
            .where('user_id', userId)
            .modify(function(queryBuilder) {
                if (startDate && endDate) {
                    queryBuilder.whereBetween('transaction_date', [startDate, endDate]);
                }
            })
            .select('category')
            .count('* as count')
            .sum('amount as total')
            .groupBy('category')
            .orderBy('total', 'desc');

        res.json({
            summary: stats,
            categories: categoryStats
        });
    } catch (error) {
        logger.error('Error fetching transaction statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Bulk import transactions
router.post('/bulk-import', async (req, res) => {
    try {
        const userId = req.user.id;
        const { transactions } = req.body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'Transactions array is required' });
        }

        const processedTransactions = [];
        const errors = [];

        for (const transactionData of transactions) {
            try {
                // Process each transaction
                const category = await categorizeTransaction(transactionData);
                const insights = await generateInsights(transactionData);

                const transaction = {
                    ...transactionData,
                    user_id: userId,
                    category,
                    ai_insights: insights,
                    is_processed: true,
                    transaction_date: transactionData.transaction_date || new Date()
                };

                const [insertedTransaction] = await db('transactions')
                    .insert(transaction)
                    .returning('*');

                processedTransactions.push(insertedTransaction);
            } catch (error) {
                errors.push({
                    transaction: transactionData,
                    error: error.message
                });
            }
        }

        res.json({
            success: processedTransactions.length,
            errors: errors.length,
            processed: processedTransactions,
            failed: errors
        });
    } catch (error) {
        logger.error('Error bulk importing transactions:', error);
        res.status(500).json({ error: 'Failed to bulk import transactions' });
    }
});

module.exports = router;
