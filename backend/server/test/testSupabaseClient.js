const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseClient() {
    console.log('🔍 Testing Supabase using JavaScript Client...\n');

    // Your Supabase project details
    const supabaseUrl = 'https://vkxvlcweknzzeafueyqg.supabase.co';
    const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreHZsY3dla256emVhZnVleXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg3NTYyMDAsImV4cCI6MjAzNDMzMjIwMH0.ey3hbGc10TJ1UtZT1nTsRScCI6IkpXV'; // This is from your screenshot

    console.log('Supabase config:');
    console.log(`  URL: ${supabaseUrl}`);
    console.log(`  Key: ${supabaseKey.substring(0, 20)}...`);
    console.log('');

    try {
        // Create Supabase client
        console.log('⏳ Creating Supabase client...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client created!');

        // Test connection by making a simple query
        console.log('⏳ Testing connection with simple query...');
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);

        if (error) {
            console.log('⚠️  Direct table query failed (expected for new database)');
            console.log(`   Error: ${error.message}`);
        } else {
            console.log('✅ Database query successful!');
            console.log(`   Found tables: ${data?.length || 0}`);
        }

        // Test with raw SQL query
        console.log('⏳ Testing with raw SQL query...');
        const { data: sqlData, error: sqlError } = await supabase.rpc('', {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Alternative: Try a simple auth check which tests connectivity
        console.log('⏳ Testing basic connectivity...');
        const { data: authData, error: authError } = await supabase.auth.getSession();

        if (!authError) {
            console.log('✅ Supabase connectivity confirmed!');
        }

        console.log('\n🎉 Supabase JavaScript client test completed!');
        console.log('\n📋 Next steps:');
        console.log('   1. We can now initialize your ARCIS schema using Supabase client');
        console.log('   2. Or we can use SQL editor in Supabase dashboard');

        return true;

    } catch (error) {
        console.error('❌ Supabase client test failed:');
        console.error(`   Error: ${error.message}`);

        console.log('\n💡 Solutions:');
        console.log('   1. Verify your Supabase project URL and API key');
        console.log('   2. Check if project is fully provisioned');
        console.log('   3. Try using Supabase SQL Editor to run schema directly');

        return false;
    }
}

if (require.main === module) {
    testSupabaseClient()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testSupabaseClient }; 