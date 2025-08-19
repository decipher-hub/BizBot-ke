const { logger } = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.errorWithContext(err, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate field value: ${field}. Please use another value.`;
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please log in again.';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired. Please log in again.';
        error = new AppError(message, 401);
    }

    // Database connection errors
    if (err.code === 'ECONNREFUSED') {
        const message = 'Database connection failed. Please try again later.';
        error = new AppError(message, 503);
    }

    // Rate limiting errors
    if (err.status === 429) {
        const message = 'Too many requests. Please try again later.';
        error = new AppError(message, 429);
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large. Please upload a smaller file.';
        error = new AppError(message, 400);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field.';
        error = new AppError(message, 400);
    }

    // Default error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Development error response
    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            success: false,
            error: {
                message,
                statusCode,
                stack: err.stack,
                details: error
            },
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
    } else {
        // Production error response
        res.status(statusCode).json({
            success: false,
            error: {
                message: statusCode === 500 ? 'Internal Server Error' : message,
                statusCode
            },
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
        });
    }
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

// Validation error handler
const validationError = (errors) => {
    const message = Object.values(errors).map(error => error.msg).join(', ');
    return new AppError(message, 400);
};

// Authorization error
const unauthorized = (message = 'Unauthorized access') => {
    return new AppError(message, 401);
};

// Forbidden error
const forbidden = (message = 'Access forbidden') => {
    return new AppError(message, 403);
};

// Not found error
const notFoundError = (message = 'Resource not found') => {
    return new AppError(message, 404);
};

// Conflict error
const conflict = (message = 'Resource conflict') => {
    return new AppError(message, 409);
};

// Too many requests error
const tooManyRequests = (message = 'Too many requests') => {
    return new AppError(message, 429);
};

// Internal server error
const internalServerError = (message = 'Internal server error') => {
    return new AppError(message, 500);
};

// Service unavailable error
const serviceUnavailable = (message = 'Service temporarily unavailable') => {
    return new AppError(message, 503);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
    notFound,
    validationError,
    unauthorized,
    forbidden,
    notFoundError,
    conflict,
    tooManyRequests,
    internalServerError,
    serviceUnavailable
};
