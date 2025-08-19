const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'bizbot-kenya',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Helper methods for different log levels
logger.startup = (message, meta = {}) => {
    logger.info(`🚀 ${message}`, { ...meta, type: 'startup' });
};

logger.api = (message, meta = {}) => {
    logger.info(`📡 ${message}`, { ...meta, type: 'api' });
};

logger.database = (message, meta = {}) => {
    logger.info(`🗄️ ${message}`, { ...meta, type: 'database' });
};

logger.security = (message, meta = {}) => {
    logger.warn(`🔒 ${message}`, { ...meta, type: 'security' });
};

logger.mpesa = (message, meta = {}) => {
    logger.info(`💰 ${message}`, { ...meta, type: 'mpesa' });
};

logger.voice = (message, meta = {}) => {
    logger.info(`🗣️ ${message}`, { ...meta, type: 'voice' });
};

logger.ai = (message, meta = {}) => {
    logger.info(`🤖 ${message}`, { ...meta, type: 'ai' });
};

logger.community = (message, meta = {}) => {
    logger.info(`🌍 ${message}`, { ...meta, type: 'community' });
};

logger.learning = (message, meta = {}) => {
    logger.info(`📚 ${message}`, { ...meta, type: 'learning' });
};

// Performance logging
logger.performance = (operation, duration, meta = {}) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger[level](`⚡ ${operation} completed in ${duration}ms`, { 
        ...meta, 
        type: 'performance',
        duration,
        operation 
    });
};

// User activity logging
logger.userActivity = (userId, action, meta = {}) => {
    logger.info(`👤 User ${userId} performed ${action}`, { 
        ...meta, 
        type: 'user_activity',
        userId,
        action 
    });
};

// Business metrics logging
logger.businessMetric = (metric, value, meta = {}) => {
    logger.info(`📊 Business metric: ${metric} = ${value}`, { 
        ...meta, 
        type: 'business_metric',
        metric,
        value 
    });
};

// Error logging with context
logger.errorWithContext = (error, context = {}) => {
    logger.error(error.message, {
        ...context,
        type: 'error',
        stack: error.stack,
        name: error.name
    });
};

// Request logging
logger.request = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id || 'anonymous'
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
};

module.exports = { logger };
