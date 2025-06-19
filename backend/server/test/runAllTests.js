#!/usr/bin/env node

/**
 * ARCIS Weapon Detection System - Test Runner
 * Runs all tests in the correct order
 */

const { runWeaponDetectionTests } = require('./testWeaponDetection');

async function runAllTests() {
    console.log('🚀 ARCIS Weapon Detection System - Full Test Suite\n');
    console.log('='.repeat(60));

    const startTime = Date.now();
    let testsPassed = 0;
    let testsFailed = 0;

    const tests = [
        {
            name: 'Weapon Detection System',
            description: 'Complete weapon detection functionality',
            testFunction: runWeaponDetectionTests
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🧪 Running: ${test.name}`);
            console.log(`📝 Description: ${test.description}`);
            console.log('-'.repeat(40));

            await test.testFunction();

            console.log(`✅ ${test.name} - PASSED`);
            testsPassed++;

        } catch (error) {
            console.error(`❌ ${test.name} - FAILED`);
            console.error(`Error: ${error.message}`);
            testsFailed++;
        }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST SUITE COMPLETE');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! ARCIS WEAPON DETECTION SYSTEM IS READY! 🎉');
        process.exit(0);
    } else {
        console.log('\n💥 SOME TESTS FAILED! Please check the errors above.');
        process.exit(1);
    }
}

// Individual test commands
const testCommands = {
    weapon: () => runWeaponDetectionTests(),
    database: () => require('./testDatabase').runFullARCISTests?.() || console.log('Database test not available'),
    middleware: () => console.log('Run: node test/testMiddleware.js'),
    server: () => console.log('Run: node test/testServer.js')
};

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Run all tests
        runAllTests();
    } else {
        const testName = args[0];
        if (testCommands[testName]) {
            console.log(`🧪 Running ${testName} test...`);
            testCommands[testName]();
        } else {
            console.log('Available test commands:');
            console.log('  npm test              - Run all tests');
            console.log('  node test/runAllTests.js weapon    - Run weapon detection tests');
            console.log('  node test/runAllTests.js database  - Run database tests');
            console.log('  node test/runAllTests.js middleware - Run middleware tests');
            console.log('  node test/runAllTests.js server    - Run server tests');
        }
    }
}

module.exports = { runAllTests }; 