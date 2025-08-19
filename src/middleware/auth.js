const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { logger } = require('../utils/logger');
const { AppError, unauthorized } = require('./errorHandler');

// Verify JWT token
const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token has expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token', 401);
        }
        throw error;
    }
};

// Get user from database
const getUserById = async (userId) => {
    try {
        const user = await db('users')
            .where('id', userId)
            .where('is_active', true)
            .first();
        
        if (!user) {
            throw new AppError('User not found or inactive', 401);
        }
        
        return user;
    } catch (error) {
        logger.error('Error fetching user:', error);
        throw new AppError('Authentication failed', 401);
    }
};

// Main authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Access token required',
                    statusCode: 401
                }
            });
        }

        // Verify token
        const decoded = await verifyToken(token);
        
        // Get user from database
        const user = await getUserById(decoded.userId);
        
        // Add user to request object
        req.user = user;
        
        // Log successful authentication
        logger.security(`User ${user.id} authenticated successfully`, {
            userId: user.id,
            email: user.email,
            ip: req.ip
        });

        next();
    } catch (error) {
        logger.security(`Authentication failed: ${error.message}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        return res.status(401).json({
            success: false,
            error: {
                message: error.message || 'Authentication failed',
                statusCode: 401
            }
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = await verifyToken(token);
            const user = await getUserById(decoded.userId);
            req.user = user;
        }

        next();
    } catch (error) {
        // Don't fail, just continue without user
        next();
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    statusCode: 401
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            logger.security(`User ${req.user.id} attempted unauthorized access`, {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                endpoint: req.originalUrl
            });

            return res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions',
                    statusCode: 403
                }
            });
        }

        next();
    };
};

// Business owner authorization (user can only access their own data)
const authorizeBusinessOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
                statusCode: 401
            }
        });
    }

    // Check if user is accessing their own data
    const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
    
    if (resourceUserId && resourceUserId !== req.user.id) {
        logger.security(`User ${req.user.id} attempted to access another user's data`, {
            userId: req.user.id,
            targetUserId: resourceUserId,
            endpoint: req.originalUrl
        });

        return res.status(403).json({
            success: false,
            error: {
                message: 'Access denied to this resource',
                statusCode: 403
            }
        });
    }

    next();
};

// Rate limiting for authentication endpoints
const authRateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts. Please try again later.',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
};

// Generate JWT token
const generateToken = (userId, expiresIn = '7d') => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            throw new AppError('Invalid refresh token', 401);
        }
        
        return decoded;
    } catch (error) {
        throw new AppError('Invalid refresh token', 401);
    }
};

// Logout middleware (blacklist token)
const logout = async (req, res, next) => {
    try {
        // In a production environment, you might want to blacklist the token
        // For now, we'll just log the logout
        logger.security(`User ${req.user.id} logged out`, {
            userId: req.user.id,
            ip: req.ip
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    authorize,
    authorizeBusinessOwner,
    authRateLimit,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    logout
};
