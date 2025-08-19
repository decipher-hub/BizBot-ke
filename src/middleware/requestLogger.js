const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
    // Add request ID for tracking
    req.id = req.headers['x-request-id'] || generateRequestId();
    
    // Add start time for performance tracking
    req.startTime = Date.now();
    
    // Log incoming request
    logger.api(`Incoming ${req.method} request to ${req.originalUrl}`, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous',
        headers: {
            'content-type': req.get('Content-Type'),
            'accept': req.get('Accept'),
            'authorization': req.get('Authorization') ? 'Bearer ***' : undefined
        }
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - req.startTime;
        
        // Log response
        logger.request(req, res, responseTime);
        
        // Log performance if response time is high
        if (responseTime > 1000) {
            logger.performance(`${req.method} ${req.originalUrl}`, responseTime, {
                requestId: req.id,
                statusCode: res.statusCode
            });
        }
        
        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };

    next();
};

// Generate unique request ID
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Middleware to add request ID to response headers
const addRequestId = (req, res, next) => {
    res.setHeader('X-Request-ID', req.id);
    next();
};

// Middleware to log request body (for debugging)
const logRequestBody = (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
        logger.api(`Request body for ${req.method} ${req.originalUrl}`, {
            requestId: req.id,
            body: req.body
        });
    }
    next();
};

// Middleware to log query parameters
const logQueryParams = (req, res, next) => {
    if (req.query && Object.keys(req.query).length > 0) {
        logger.api(`Query parameters for ${req.method} ${req.originalUrl}`, {
            requestId: req.id,
            query: req.query
        });
    }
    next();
};

// Middleware to track user activity
const trackUserActivity = (req, res, next) => {
    if (req.user) {
        logger.userActivity(req.user.id, `${req.method} ${req.originalUrl}`, {
            requestId: req.id,
            ip: req.ip
        });
    }
    next();
};

module.exports = {
    requestLogger,
    addRequestId,
    logRequestBody,
    logQueryParams,
    trackUserActivity
};
