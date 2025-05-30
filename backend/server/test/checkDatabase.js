const { query, testConnection } = require('../config/db');

async function checkDatabase() {
    console.log('🔍 Checking current database state...\n');

    try {
        await testConnection();

        // Check if arcis schema exists
        const schemaCheck = await query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'arcis'
        `);

        console.log('ARCIS Schema exists:', schemaCheck.rows.length > 0);

        // List all schemas
        const allSchemas = await query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `);

        console.log('Available schemas:');
        allSchemas.rows.forEach(row => {
            console.log(`  - ${row.schema_name}`);
        });

        // If arcis schema exists, list tables
        if (schemaCheck.rows.length > 0) {
            const tables = await query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'arcis'
            `);

            console.log('\nTables in ARCIS schema:');
            tables.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

if (require.main === module) {
    checkDatabase();
}

module.exports = { checkDatabase }; 