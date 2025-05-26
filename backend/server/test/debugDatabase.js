const { query, testConnection } = require('../config/db');

async function debugDatabase() {
    console.log('🔍 Debugging ARCIS Database...\n');

    try {
        // Test basic connection
        await testConnection();

        // Check if schema exists
        console.log('Checking schema...');
        const schemaResult = await query(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'arcis'"
        );
        console.log('Schema exists:', schemaResult.rows.length > 0);

        // Check if tables exist
        console.log('\nChecking tables...');
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'arcis' OR table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('Tables found:', tablesResult.rows.map(r => r.table_name));

        // Check if views exist
        console.log('\nChecking views...');
        const viewsResult = await query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'arcis' OR table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('Views found:', viewsResult.rows.map(r => r.table_name));

        // Check if ENUM type exists
        console.log('\nChecking ENUM types...');
        const enumResult = await query(`
            SELECT typname 
            FROM pg_type 
            WHERE typname = 'object_category'
        `);
        console.log('object_category ENUM exists:', enumResult.rows.length > 0);

        console.log('\n✅ Database debug completed');

    } catch (error) {
        console.error('❌ Database debug failed:', error);
    }
}

if (require.main === module) {
    debugDatabase();
}

module.exports = { debugDatabase }; 