const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

// Import utilities
const { logger } = require('./utils/logger');

class App {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);

        // Compression
        this.app.use(compression());

        // Logging
        this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
        this.app.use(requestLogger);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    }

    initializeRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });

        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/transactions', transactionRoutes);
        this.app.use('/api/analytics', analyticsRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/dashboard', dashboardRoutes);

        // API documentation
        this.app.get('/api/docs', (req, res) => {
            res.json({
                message: 'BizBot Kenya API Documentation',
                version: '1.0.0',
                endpoints: {
                    auth: '/api/auth',
                    transactions: '/api/transactions',
                    analytics: '/api/analytics',
                    users: '/api/users',
                    dashboard: '/api/dashboard'
                },
                documentation: '/docs/api'
            });
        });

        // Serve React app for production
        if (process.env.NODE_ENV === 'production') {
            this.app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '../client/build/index.html'));
            });
        }

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                message: 'The requested resource does not exist',
                path: req.originalUrl,
                method: req.method
            });
        });
    }

    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    async start() {
        try {
            // Initialize database connection
            const { initializeDatabase } = require('./config/database');
            await initializeDatabase();
            logger.info('Database connected successfully');

            // Start server
            this.app.listen(this.port, () => {
                logger.info(`🚀 BizBot Kenya server running on port ${this.port}`);
                logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
                logger.info(`📚 API docs: http://localhost:${this.port}/api/docs`);
                
                if (process.env.NODE_ENV === 'development') {
                    logger.info(`🌐 Frontend: http://localhost:3000`);
                }
            });

            // Graceful shutdown
            process.on('SIGTERM', () => {
                logger.info('SIGTERM received, shutting down gracefully');
                this.shutdown();
            });

            process.on('SIGINT', () => {
                logger.info('SIGINT received, shutting down gracefully');
                this.shutdown();
            });

        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        try {
            const { closeDatabase } = require('./config/database');
            await closeDatabase();
            logger.info('Server shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

module.exports = App;
