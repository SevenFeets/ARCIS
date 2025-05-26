require('dotenv').config();

console.log('DB_PASSWORD from .env:', process.env.DB_PASSWORD ? '***found***' : 'not found');

const dbConfig = {
    password: process.env.DB_PASSWORD || 'password',
};

console.log('Final password being used:', dbConfig.password === '4wrdjz67' ? '***your real password***' : 'fallback password'); 