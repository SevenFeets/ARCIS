const { query, testConnection, initializeDatabase } = require('../config/db');

async function checkAlertsSchema() {
    console.log('🔍 Checking alerts table schema...\n');

    try {
        await testConnection();
        await initializeDatabase();

        const schemaCheck = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'alerts' 
            AND table_schema = 'arcis'
            ORDER BY ordinal_position
        `);

        console.log('📋 Alerts table schema:');
        schemaCheck.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
    }
}

if (require.main === module) {
    checkAlertsSchema();
}

module.exports = { checkAlertsSchema }; 