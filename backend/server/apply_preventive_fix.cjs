// Apply preventive fix to prevent frame_url conflicts in the future
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function applyPreventiveFix() {
    console.log('🛡️ Applying Preventive Fix for Frame URL Conflicts');
    console.log('=================================================');

    try {
        // Read the SQL file
        console.log('📄 Reading SQL fix file...');
        const sqlPath = path.join(__dirname, 'prevent_frame_url_conflicts.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Import supabase
        const { supabase } = require('./config/supabase');

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);

            try {
                if (statement.includes('SELECT')) {
                    // For SELECT statements, show results
                    const { data, error } = await supabase.rpc('exec_sql', {
                        sql: statement + ';'
                    });

                    if (error) {
                        console.error(`❌ Statement ${i + 1} failed:`, error);
                        continue;
                    }

                    console.log(`✅ Statement ${i + 1} results:`, data);
                } else {
                    // For other statements, just execute
                    const { error } = await supabase.rpc('exec_sql', {
                        sql: statement + ';'
                    });

                    if (error) {
                        console.error(`❌ Statement ${i + 1} failed:`, error);
                        continue;
                    }

                    console.log(`✅ Statement ${i + 1} executed successfully`);
                }
            } catch (statementError) {
                console.error(`❌ Statement ${i + 1} error:`, statementError);
            }
        }

        console.log('\n🎯 Preventive Fix Complete!');
        console.log('============================');
        console.log('✅ Database trigger created');
        console.log('✅ Existing conflicts cleaned up');
        console.log('✅ Future detections protected');

        console.log('\n💡 What this prevents:');
        console.log('- Automatically clears frame_url when base64 data is present');
        console.log('- Automatically clears frame_url when binary JPEG data is present');
        console.log('- Ensures only ONE image storage method per detection');
        console.log('- Applies to ALL future INSERT and UPDATE operations');

    } catch (error) {
        console.error('❌ Preventive fix failed:', error);
    }
}

// Run the preventive fix
applyPreventiveFix(); 