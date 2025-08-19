const knex = require('knex');
const { logger } = require('../utils/logger');

// Database configuration
const dbConfig = {
    development: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'bizbot_user',
            password: process.env.DB_PASSWORD || 'bizbot_password',
            database: process.env.DB_NAME || 'bizbot_kenya_dev'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            directory: '../migrations'
        },
        seeds: {
            directory: '../seeds'
        }
    },
    production: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        },
        pool: {
            min: 2,
            max: 20
        },
        migrations: {
            directory: '../migrations'
        },
        seeds: {
            directory: '../seeds'
        }
    }
};

// Create Knex instance
const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

const db = knex(config);

// Test database connection
async function testConnection() {
    try {
        await db.raw('SELECT 1');
        logger.info('Database connection successful');
        return true;
    } catch (error) {
        logger.error('Database connection failed:', error);
        return false;
    }
}

// Initialize database
async function initializeDatabase() {
    try {
        // Test connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Database connection failed');
        }

        // Run migrations
        await db.migrate.latest();
        logger.info('Database migrations completed');

        // Run seeds in development
        if (environment === 'development') {
            await db.seed.run();
            logger.info('Database seeds completed');
        }

        return db;
    } catch (error) {
        logger.error('Database initialization failed:', error);
        throw error;
    }
}

// Close database connection
async function closeDatabase() {
    try {
        await db.destroy();
        logger.info('Database connection closed');
    } catch (error) {
        logger.error('Error closing database connection:', error);
    }
}

module.exports = {
    db,
    initializeDatabase,
    closeDatabase,
    testConnection
};
