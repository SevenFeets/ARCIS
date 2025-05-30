const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Debugging Environment Variables...\n');

console.log('Environment variables:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
console.log('DB_PASSWORD value:', process.env.DB_PASSWORD);
console.log('DB_PORT:', process.env.DB_PORT);

console.log('\nAll environment variables starting with DB_:');
Object.keys(process.env)
    .filter(key => key.startsWith('DB_'))
    .forEach(key => {
        console.log(`${key}:`, process.env[key]);
    });

console.log('\nCurrent working directory:', process.cwd());
console.log('.env file should be at:', process.cwd() + '/.env');

// Check if .env file exists
const fs = require('fs');
const envPath = path.join(process.cwd(), '.env');
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log('.env file contents:');
    console.log(fs.readFileSync(envPath, 'utf8'));
} 