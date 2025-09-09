const DetectionService = require('../services/detectionService');
const AlertService = require('../services/alertService');
const ImageService = require('../services/imageService');
const {
    convertJetsonToStandardFormat,
    convertCloudVisionToStandardFormat,
    formatFrameDataUrl,
    extractDeviceInfo
} = require('../mappingHelpers');
const {
    isWeaponDetection,
    calculateThreatLevel,
    createApiResponse,
    createErrorResponse,
    safeJsonParse
} = require('../detectionHelpers');

/**
 * Device Controller - Handles device-specific detection endpoints (Jetson, Raspberry Pi)
 */
class DeviceController {
    constructor() {
        this.detectionService = new DetectionService();
        this.alertService = new AlertService();
        this.imageService = new ImageService();
    }

    /**
     * Process detection data from Jetson Nano
     */
    async processJetsonDetection(req, res) {
        try {
            const {
                detectedObjects,
                frame, // base64 encoded image
                systemMetrics,
                timestamp,
                deviceId
            } = req.body;

            console.log('Received Jetson detection:', {
                objectCount: detectedObjects?.length || 0,
                timestamp,
                deviceId
            });

            if (!Array.isArray(detectedObjects) || detectedObjects.length === 0) {
                return res.status(400).json(createErrorResponse('No detected objects provided', 'NO_OBJECTS'));
            }

            // Process each detected object
            const results = [];

            for (const obj of detectedObjects) {
                // Convert Jetson format to standard format
                const standardizedDetection = convertJetsonToStandardFormat(obj, deviceId, frame, systemMetrics, timestamp);

                // Only process weapon detections
                if (isWeaponDetection(standardizedDetection.object_type)) {
                    const threatLevel = calculateThreatLevel(standardizedDetection.object_type, standardizedDetection.confidence);

                    // Format frame data as proper data URL for frontend display
                    const formattedFrameData = formatFrameDataUrl(frame);

                    // Create detection record
                    const detectionData = {
                        frame_id: null,
                        object_category: 'weapon',
                        object_type: standardizedDetection.object_type,
                        confidence: standardizedDetection.confidence,
                        bounding_box: standardizedDetection.bounding_box,
                        threat_level: threatLevel,
                        metadata: standardizedDetection.metadata,
                        detection_frame_data: formattedFrameData,
                        system_metrics: systemMetrics || {},
                        device_id: deviceId,
                        device_name: req.body.deviceName || 'jetson nano'
                    };

                    const detection = await this.detectionService.createDetection(detectionData);

                    // Create alert if needed
                    if (this.alertService.shouldCreateAlert(detection)) {
                        await this.alertService.createThreatAlert(detection);
                    }

                    results.push({
                        detection_id: detection.detection_id,
                        weapon_type: standardizedDetection.object_type,
                        threat_level: threatLevel,
                        confidence: Math.round(standardizedDetection.confidence * 100)
                    });
                }
            }

            res.status(201).json(createApiResponse(true, {
                processed_detections: results.length,
                detections: results,
                device_id: deviceId
            }, 'Jetson detection data processed successfully'));

        } catch (error) {
            console.error('Error processing Jetson detection:', error);
            res.status(500).json(createErrorResponse('Failed to process Jetson detection data', 'JETSON_PROCESSING_ERROR', error.message));
        }
    }

    /**
     * Process detection data from Raspberry Pi with Google Cloud Vision
     */
    async processRaspberryPiDetection(req, res) {
        try {
            const {
                cloudVisionResults,
                systemMetrics,
                timestamp,
                deviceId
            } = req.body;

            console.log('📸 Raspberry Pi detection with JPG file upload:', {
                resultsCount: Array.isArray(cloudVisionResults) ? cloudVisionResults.length : 0,
                hasFile: !!req.file,
                fileInfo: req.file ? {
                    filename: req.file.filename,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                } : null,
                timestamp,
                deviceId
            });

            // Parse cloudVisionResults if it's a string
            const parsedResults = safeJsonParse(cloudVisionResults, []);

            // Handle uploaded JPG file - store as binary JPEG for best performance
            let jpegBuffer = null;
            let frameMetadata = null;

            if (req.file) {
                // Validate file type
                if (!req.file.mimetype.includes('jpeg') && !req.file.mimetype.includes('jpg')) {
                    return res.status(400).json(createErrorResponse('Invalid file type for Raspberry Pi', 'INVALID_FILE_TYPE', {
                        message: 'Only JPEG/JPG files are supported',
                        received: req.file.mimetype
                    }));
                }

                // Process the uploaded JPEG
                const processedImage = await this.imageService.processUploadedJpeg(req.file);
                jpegBuffer = processedImage.buffer;
                frameMetadata = processedImage.metadata;

                console.log(`📸 JPG file processed: ${jpegBuffer.length} bytes`);

                // Clean up uploaded file
                this.imageService.cleanupUploadedFile(req.file.path);
            }

            // Process each Cloud Vision result
            const results = [];

            for (const result of parsedResults) {
                // Convert Google Cloud Vision format to standard format
                const standardizedDetection = convertCloudVisionToStandardFormat(result, deviceId, systemMetrics, timestamp);

                // Only process weapon detections
                if (isWeaponDetection(standardizedDetection.object_type)) {
                    const threatLevel = calculateThreatLevel(standardizedDetection.object_type, standardizedDetection.confidence);

                    // Create detection record with binary JPEG storage
                    const detectionData = {
                        frame_id: null,
                        object_category: 'weapon',
                        object_type: standardizedDetection.object_type,
                        confidence: standardizedDetection.confidence,
                        bounding_box: standardizedDetection.bounding_box,
                        threat_level: threatLevel,
                        metadata: standardizedDetection.metadata,
                        detection_frame_jpeg: jpegBuffer ? jpegBuffer.toString('base64') : null, // Store as base64 string
                        frame_metadata: frameMetadata,
                        system_metrics: systemMetrics || {}
                    };

                    const detection = await this.detectionService.createDetection(detectionData);

                    // Create alert if needed
                    if (this.alertService.shouldCreateAlert(detection)) {
                        await this.alertService.createThreatAlert(detection);
                    }

                    results.push({
                        detection_id: detection.detection_id,
                        weapon_type: standardizedDetection.object_type,
                        threat_level: threatLevel,
                        confidence: Math.round(standardizedDetection.confidence * 100),
                        has_binary_jpeg: true,
                        jpeg_endpoint: `/detections/${detection.detection_id}/jpeg`,
                        storage_method: 'binary_jpeg_database'
                    });
                }
            }

            res.status(201).json(createApiResponse(true, {
                processed_detections: results.length,
                detections: results,
                device_id: deviceId,
                file_processed: !!req.file,
                jpeg_size: jpegBuffer ? jpegBuffer.length : 0,
                storage_method: 'binary_jpeg_database'
            }, 'Raspberry Pi detection data with JPG file processed successfully'));

        } catch (error) {
            console.error('Error processing Raspberry Pi detection:', error);
            res.status(500).json(createErrorResponse('Failed to process Raspberry Pi detection data', 'RASPBERRY_PI_PROCESSING_ERROR', error.message));
        }
    }

    /**
     * Update device status (heartbeat endpoint)
     */
    async updateDeviceStatus(req, res) {
        try {
            const { device_id, status, system_metrics } = req.body;

            // Note: This would need to be implemented in a DeviceService
            // For now, return a placeholder response
            const deviceStatus = {
                device_id: device_id || req.deviceId || '1',
                status: status || 'online',
                last_updated: new Date().toISOString(),
                system_metrics: system_metrics || {}
            };

            res.json(createApiResponse(true, deviceStatus, 'Device status updated'));

        } catch (error) {
            console.error('Device status error:', error);
            res.status(500).json(createErrorResponse('Failed to update device status', 'DEVICE_STATUS_ERROR', error.message));
        }
    }

    /**
     * Upload detection with file (file storage approach)
     */
    async uploadDetectionWithFile(req, res) {
        try {
            console.log('📸 File upload detection endpoint called');
            console.log('📁 Uploaded file:', req.file);
            console.log('📋 Body data:', req.body);

            const {
                object_type,
                confidence,
                bounding_box,
                threat_level,
                system_metrics,
                session_id,
                timestamp,
                device_id
            } = req.body;

            // Validate required fields
            if (!object_type || !confidence || !bounding_box) {
                return res.status(400).json(createErrorResponse('Missing required fields', 'MISSING_REQUIRED_FIELDS', {
                    required: ['object_type', 'confidence', 'bounding_box'],
                    received: Object.keys(req.body)
                }));
            }

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json(createErrorResponse('No detection frame image uploaded', 'NO_FILE', 'Include detection_frame file in multipart form data'));
            }

            // Create frame URL path (relative to server)
            const frameUrl = `/api/images/${req.file.filename}`;

            // Extract device information
            const parsedMetadata = safeJsonParse(req.body.metadata);
            const systemMetricsData = safeJsonParse(system_metrics);
            const deviceInfo = extractDeviceInfo(req.body, parsedMetadata, systemMetricsData, req.deviceId);

            // Create detection record with frame URL
            const detectionData = {
                object_category: 'weapon',
                object_type: object_type,
                confidence: parseFloat(confidence),
                bounding_box: typeof bounding_box === 'string' ? JSON.parse(bounding_box) : bounding_box,
                threat_level: threat_level || calculateThreatLevel(object_type, confidence),
                frame_url: frameUrl, // Store file URL instead of base64
                system_metrics: systemMetricsData,
                timestamp: timestamp || new Date().toISOString(),
                metadata: {
                    device_id: deviceInfo.deviceId,
                    device_name: deviceInfo.deviceName,
                    device_type: deviceInfo.deviceType,
                    file_info: {
                        original_name: req.file.originalname,
                        filename: req.file.filename,
                        size: req.file.size,
                        mimetype: req.file.mimetype
                    },
                    ...parsedMetadata
                }
            };

            const detection = await this.detectionService.createDetection(detectionData);

            // Create alert if threat level is high
            let alertCreated = false;
            if (this.alertService.shouldCreateAlert(detection)) {
                await this.alertService.createThreatAlert(detection);
                alertCreated = true;
            }

            res.json(createApiResponse(true, {
                data: detection,
                frame_url: frameUrl,
                file_info: {
                    filename: req.file.filename,
                    size: req.file.size,
                    path: req.file.path
                },
                alert_created: alertCreated
            }, 'Detection with image file recorded successfully'));

        } catch (error) {
            console.error('File upload detection error:', error);
            res.status(500).json(createErrorResponse('Failed to process detection upload', 'FILE_UPLOAD_ERROR', error.message));
        }
    }

    /**
     * Upload detection with binary JPEG data
     */
    async uploadDetectionWithJpeg(req, res) {
        try {
            console.log('📸 Binary JPEG upload endpoint called');

            const {
                object_type,
                confidence,
                bounding_box,
                threat_level,
                system_metrics,
                timestamp,
                device_id
            } = req.body;

            // Validate required fields
            if (!object_type || !confidence || !bounding_box) {
                return res.status(400).json(createErrorResponse('Missing required fields', 'MISSING_REQUIRED_FIELDS', {
                    required: ['object_type', 'confidence', 'bounding_box'],
                    received: Object.keys(req.body)
                }));
            }

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json(createErrorResponse('No JPEG image uploaded', 'NO_FILE', 'Include detection_frame file in multipart form data'));
            }

            // Process the uploaded JPEG
            const processedImage = await this.imageService.processUploadedJpeg(req.file);

            // Extract device information
            const parsedMetadata = safeJsonParse(req.body.metadata);
            const systemMetricsData = safeJsonParse(system_metrics);
            const deviceInfo = extractDeviceInfo(req.body, parsedMetadata, systemMetricsData, req.deviceId);

            // Create detection record with binary JPEG data
            const detectionData = {
                object_category: 'weapon',
                object_type: object_type,
                confidence: parseFloat(confidence),
                bounding_box: typeof bounding_box === 'string' ? JSON.parse(bounding_box) : bounding_box,
                threat_level: threat_level || calculateThreatLevel(object_type, confidence),
                detection_frame_jpeg: processedImage.base64, // Store as base64 string
                frame_metadata: processedImage.metadata,
                system_metrics: systemMetricsData,
                timestamp: timestamp || new Date().toISOString(),
                metadata: {
                    device_id: deviceInfo.deviceId,
                    device_name: deviceInfo.deviceName,
                    device_type: deviceInfo.deviceType,
                    storage_method: 'base64_jpeg_database',
                    ...parsedMetadata
                }
            };

            const detection = await this.detectionService.createDetection(detectionData);

            // Clean up uploaded file
            this.imageService.cleanupUploadedFile(req.file.path);

            // Create alert if threat level is high
            let alertCreated = false;
            if (this.alertService.shouldCreateAlert(detection)) {
                await this.alertService.createThreatAlert(detection);
                alertCreated = true;
            }

            res.json(createApiResponse(true, {
                data: detection,
                storage_method: 'binary_jpeg_database',
                jpeg_size: processedImage.buffer.length,
                frame_metadata: processedImage.metadata,
                alert_created: alertCreated
            }, 'Detection with binary JPEG recorded successfully'));

        } catch (error) {
            console.error('Binary JPEG upload error:', error);
            res.status(500).json(createErrorResponse('Failed to process binary JPEG upload', 'JPEG_UPLOAD_ERROR', error.message));
        }
    }
}

module.exports = DeviceController;
