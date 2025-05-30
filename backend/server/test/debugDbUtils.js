const { dbUtils } = require('../config/db');

console.log('🔍 Debugging dbUtils object...\n');

console.log('dbUtils exists:', !!dbUtils);
console.log('dbUtils type:', typeof dbUtils);

if (dbUtils) {
    console.log('\nAvailable dbUtils properties:');
    Object.keys(dbUtils).forEach(key => {
        console.log(`- ${key}:`, typeof dbUtils[key]);
        if (typeof dbUtils[key] === 'object' && dbUtils[key] !== null) {
            console.log(`  Methods: ${Object.keys(dbUtils[key]).join(', ')}`);
        }
    });
} else {
    console.log('❌ dbUtils is undefined!');
}

console.log('\n�� Debug completed'); 