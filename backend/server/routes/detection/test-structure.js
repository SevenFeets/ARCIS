/**
 * Test Script for Refactored Detection Module
 * 
 * This script tests that all modules can be imported and instantiated correctly.
 * Run this before migrating to ensure the structure is valid.
 */

const path = require('path');

async function testStructure() {
    console.log('🧪 Testing refactored detection module structure...\n');

    const tests = [
        {
            name: 'DetectionHelpers',
            path: './detectionHelpers.js',
            test: (module) => {
                const required = ['calculateThreatLevel', 'isWeaponDetection', 'formatDetectionForFrontend'];
                return required.every(fn => typeof module[fn] === 'function');
            }
        },
        {
            name: 'MappingHelpers',
            path: './mappingHelpers.js',
            test: (module) => {
                const required = ['mapJetsonClassToWeaponType', 'mapCloudVisionToWeaponType'];
                return required.every(fn => typeof module[fn] === 'function');
            }
        },
        {
            name: 'DetectionService',
            path: './services/detectionService.js',
            test: (ServiceClass) => {
                const service = new ServiceClass();
                const required = ['createDetection', 'getDetectionById', 'getRecentDetections'];
                return required.every(method => typeof service[method] === 'function');
            }
        },
        {
            name: 'AlertService',
            path: './services/alertService.js',
            test: (ServiceClass) => {
                const service = new ServiceClass();
                const required = ['createThreatAlert', 'shouldCreateAlert'];
                return required.every(method => typeof service[method] === 'function');
            }
        },
        {
            name: 'ImageService',
            path: './services/imageService.js',
            test: (ServiceClass) => {
                const service = new ServiceClass();
                const required = ['processUploadedJpeg', 'convertToJpegBuffer', 'isValidJpeg'];
                return required.every(method => typeof service[method] === 'function');
            }
        },
        {
            name: 'DetectionController',
            path: './controllers/detectionController.js',
            test: (ControllerClass) => {
                const controller = new ControllerClass();
                const required = ['getAllDetections', 'getDetectionById', 'createDetection'];
                return required.every(method => typeof controller[method] === 'function');
            }
        },
        {
            name: 'ThreatController',
            path: './controllers/threatController.js',
            test: (ControllerClass) => {
                const controller = new ControllerClass();
                const required = ['getHighPriorityThreats', 'getThreatAnalysis'];
                return required.every(method => typeof controller[method] === 'function');
            }
        },
        {
            name: 'ManualController',
            path: './controllers/manualController.js',
            test: (ControllerClass) => {
                const controller = new ControllerClass();
                const required = ['getManualDetections', 'createManualDetection'];
                return required.every(method => typeof controller[method] === 'function');
            }
        },
        {
            name: 'DeviceController',
            path: './controllers/deviceController.js',
            test: (ControllerClass) => {
                const controller = new ControllerClass();
                const required = ['processJetsonDetection', 'processRaspberryPiDetection'];
                return required.every(method => typeof controller[method] === 'function');
            }
        },
        {
            name: 'ImageController',
            path: './controllers/imageController.js',
            test: (ControllerClass) => {
                const controller = new ControllerClass();
                const required = ['getDetectionFrame', 'serveDetectionJpeg'];
                return required.every(method => typeof controller[method] === 'function');
            }
        }
    ];

    let passedTests = 0;
    let failedTests = 0;

    for (const { name, path: modulePath, test } of tests) {
        try {
            const fullPath = path.join(__dirname, modulePath);
            const module = require(fullPath);

            if (test(module)) {
                console.log(`✅ ${name}: Structure valid`);
                passedTests++;
            } else {
                console.log(`❌ ${name}: Missing required methods`);
                failedTests++;
            }
        } catch (error) {
            console.log(`❌ ${name}: Import failed - ${error.message}`);
            failedTests++;
        }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);

    if (failedTests === 0) {
        console.log(`\n🎉 All structure tests passed! The refactored module is ready for migration.`);
        return true;
    } else {
        console.log(`\n⚠️  Some tests failed. Please fix the issues before migrating.`);
        return false;
    }
}

// Run tests if called directly
if (require.main === module) {
    testStructure();
}

module.exports = { testStructure };
