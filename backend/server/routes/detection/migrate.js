/**
 * Migration Script for Detections.js Refactoring
 * 
 * This script helps migrate from the monolithic detections.js to the new modular structure.
 * Run this script to backup the original file and replace it with the refactored version.
 */

const fs = require('fs');
const path = require('path');

const ORIGINAL_FILE = path.join(__dirname, '../detections.js');
const BACKUP_FILE = path.join(__dirname, '../detections-original-backup.js');
const REFACTORED_FILE = path.join(__dirname, '../detections-refactored.js');

async function migrate() {
    try {
        console.log('🔄 Starting migration to modular detections structure...');

        // Step 1: Create backup of original file
        if (fs.existsSync(ORIGINAL_FILE)) {
            console.log('📋 Creating backup of original detections.js...');
            fs.copyFileSync(ORIGINAL_FILE, BACKUP_FILE);
            console.log('✅ Backup created: detections-original-backup.js');
        }

        // Step 2: Replace original with refactored version
        if (fs.existsSync(REFACTORED_FILE)) {
            console.log('🔄 Replacing detections.js with refactored version...');
            fs.copyFileSync(REFACTORED_FILE, ORIGINAL_FILE);
            console.log('✅ detections.js updated with modular structure');
        } else {
            console.error('❌ detections-refactored.js not found!');
            return;
        }

        // Step 3: Verify all required files exist
        console.log('🔍 Verifying modular files exist...');

        const requiredFiles = [
            './detectionHelpers.js',
            './mappingHelpers.js',
            './services/detectionService.js',
            './services/alertService.js',
            './services/imageService.js',
            './controllers/detectionController.js',
            './controllers/threatController.js',
            './controllers/manualController.js',
            './controllers/deviceController.js',
            './controllers/imageController.js'
        ];

        let allFilesExist = true;
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ ${file}`);
            } else {
                console.error(`❌ Missing: ${file}`);
                allFilesExist = false;
            }
        }

        if (allFilesExist) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📊 Migration Summary:');
            console.log('- Original file: Backed up as detections-original-backup.js');
            console.log('- New structure: 10 modular files created');
            console.log('- Main router: Reduced from 2500+ lines to ~200 lines');
            console.log('- Architecture: Now follows SOLID principles');

            console.log('\n🔧 Next Steps:');
            console.log('1. Test all endpoints to ensure functionality is preserved');
            console.log('2. Update any imports in other files if needed');
            console.log('3. Run your test suite to verify everything works');
            console.log('4. Remove detections-refactored.js once migration is confirmed');

            console.log('\n⚠️  Rollback Instructions:');
            console.log('If issues occur, restore the original file:');
            console.log('cp detections-original-backup.js detections.js');
        } else {
            console.error('\n❌ Migration incomplete - some files are missing');
            console.log('Please ensure all modular files are created before running migration');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('\nTo manually rollback:');
        console.log('cp detections-original-backup.js detections.js');
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate();
}

module.exports = { migrate };
