#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up BizBot Kenya...\n');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'green') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`\n${colors.blue}${step}${colors.reset}: ${message}`);
}

// Check if .env file exists
function checkEnvFile() {
    logStep('1', 'Checking environment configuration...');
    
    const envPath = path.join(__dirname, '..', '.env');
    const envExamplePath = path.join(__dirname, '..', 'env.example');
    
    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(envExamplePath)) {
            log('Creating .env file from template...', 'yellow');
            fs.copyFileSync(envExamplePath, envPath);
            log('✅ .env file created. Please edit it with your configuration.', 'green');
        } else {
            log('❌ env.example file not found. Please create a .env file manually.', 'red');
            process.exit(1);
        }
    } else {
        log('✅ .env file already exists.', 'green');
    }
}

// Check Node.js version
function checkNodeVersion() {
    logStep('2', 'Checking Node.js version...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
        log(`❌ Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`, 'red');
        process.exit(1);
    }
    
    log(`✅ Node.js version ${nodeVersion} is supported.`, 'green');
}

// Install dependencies
function installDependencies() {
    logStep('3', 'Installing dependencies...');
    
    try {
        log('Installing npm packages...', 'yellow');
        execSync('npm install', { stdio: 'inherit' });
        log('✅ Dependencies installed successfully.', 'green');
    } catch (error) {
        log('❌ Failed to install dependencies.', 'red');
        process.exit(1);
    }
}

// Check PostgreSQL
function checkPostgreSQL() {
    logStep('4', 'Checking PostgreSQL...');
    
    try {
        execSync('psql --version', { stdio: 'pipe' });
        log('✅ PostgreSQL is installed.', 'green');
    } catch (error) {
        log('❌ PostgreSQL is not installed or not in PATH.', 'red');
        log('Please install PostgreSQL and ensure it\'s in your PATH.', 'yellow');
        log('Visit: https://www.postgresql.org/download/', 'blue');
        process.exit(1);
    }
}

// Create database
function createDatabase() {
    logStep('5', 'Setting up database...');
    
    try {
        log('Creating database...', 'yellow');
        execSync('npm run db:create', { stdio: 'pipe' });
        log('✅ Database created successfully.', 'green');
    } catch (error) {
        log('Database might already exist or there was an error.', 'yellow');
        log('You can manually create it with: createdb bizbot_kenya_dev', 'blue');
    }
}

// Run migrations
function runMigrations() {
    logStep('6', 'Running database migrations...');
    
    try {
        log('Running migrations...', 'yellow');
        execSync('npm run migrate', { stdio: 'inherit' });
        log('✅ Migrations completed successfully.', 'green');
    } catch (error) {
        log('❌ Failed to run migrations.', 'red');
        log('Please check your database connection in .env file.', 'yellow');
        process.exit(1);
    }
}

// Create necessary directories
function createDirectories() {
    logStep('7', 'Creating necessary directories...');
    
    const directories = [
        'logs',
        'uploads',
        'temp',
        'client/build'
    ];
    
    directories.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            log(`✅ Created directory: ${dir}`, 'green');
        } else {
            log(`✅ Directory already exists: ${dir}`, 'green');
        }
    });
}

// Test the application
function testApplication() {
    logStep('8', 'Testing application...');
    
    try {
        log('Testing database connection...', 'yellow');
        execSync('node -e "require(\'./src/config/database\').testConnection().then(() => process.exit(0)).catch(() => process.exit(1))"', { stdio: 'pipe' });
        log('✅ Database connection test passed.', 'green');
    } catch (error) {
        log('❌ Database connection test failed.', 'red');
        log('Please check your database configuration in .env file.', 'yellow');
    }
}

// Display next steps
function displayNextSteps() {
    logStep('9', 'Setup complete! Next steps:');
    
    console.log(`
${colors.green}🎉 BizBot Kenya setup is complete!${colors.reset}

${colors.blue}Next steps:${colors.reset}
1. Edit the .env file with your configuration
2. Start the development server: ${colors.yellow}npm run dev${colors.reset}
3. Visit: ${colors.blue}http://localhost:3000${colors.reset}
4. API documentation: ${colors.blue}http://localhost:3000/api/docs${colors.reset}

${colors.blue}Available commands:${colors.reset}
- ${colors.yellow}npm run dev${colors.reset} - Start development server
- ${colors.yellow}npm run test${colors.reset} - Run tests
- ${colors.yellow}npm run migrate${colors.reset} - Run database migrations
- ${colors.yellow}npm run seed${colors.reset} - Seed database with sample data
- ${colors.yellow}npm run lint${colors.reset} - Run ESLint
- ${colors.yellow}npm run format${colors.reset} - Format code with Prettier

${colors.blue}Project structure:${colors.reset}
- ${colors.green}src/${colors.reset} - Backend source code
- ${colors.green}client/${colors.reset} - Frontend React application
- ${colors.green}public/${colors.reset} - Static files and landing page
- ${colors.green}migrations/${colors.reset} - Database migrations
- ${colors.green}docs/${colors.reset} - Documentation

${colors.blue}Support:${colors.reset}
- Documentation: ${colors.blue}README.md${colors.reset}
- Project Management: ${colors.blue}PROJECT_MANAGEMENT.md${colors.reset}
- Issues: Create an issue on GitHub

${colors.green}Happy coding! 🇰🇪🚀${colors.reset}
`);
}

// Main setup function
async function setup() {
    try {
        checkNodeVersion();
        checkEnvFile();
        installDependencies();
        checkPostgreSQL();
        createDatabase();
        runMigrations();
        createDirectories();
        testApplication();
        displayNextSteps();
    } catch (error) {
        log(`❌ Setup failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setup();
}

module.exports = { setup };
