const ImageService = require('../services/imageService');
const { createErrorResponse } = require('../detectionHelpers');

/**
 * Image Controller - Handles image serving and processing endpoints
 */
class ImageController {
    constructor() {
        this.imageService = new ImageService();
    }

    /**
     * Serve detection frame as legacy base64 data URL
     */
    async getDetectionFrame(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            const { frameData } = await this.imageService.getDetectionFrame(detectionId);

            const detection = await this.imageService.getDetectionJpeg(detectionId);

            res.json({
                success: true,
                detection_id: detectionId,
                frame_data: frameData,
                timestamp: new Date().toISOString(),
                message: 'Frame data retrieved successfully'
            });

        } catch (error) {
            console.error('Get detection frame error:', error);

            if (error.message.includes('not found')) {
                res.status(404).json(createErrorResponse('Detection not found', 'DETECTION_NOT_FOUND'));
            } else if (error.message.includes('No frame data available')) {
                res.status(404).json(createErrorResponse('No frame data available for this detection', 'NO_FRAME_DATA'));
            } else {
                res.status(500).json(createErrorResponse('Failed to retrieve frame data', 'GET_FRAME_ERROR', error.message));
            }
        }
    }

    /**
     * Serve binary JPEG data directly from database
     */
    async serveDetectionJpeg(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            const { jpegData, frameMetadata } = await this.imageService.getDetectionJpeg(detectionId);

            if (!jpegData) {
                return res.status(404).json(createErrorResponse('No JPEG data found for this detection', 'NO_JPEG_DATA'));
            }

            // Convert JPEG data to buffer
            const jpegBuffer = this.imageService.convertToJpegBuffer(jpegData);

            if (!jpegBuffer) {
                return res.status(500).json(createErrorResponse('Failed to process JPEG data', 'JPEG_PROCESSING_ERROR', 'JPEG buffer is null or empty'));
            }

            // Check if the JPEG data is valid
            if (!this.imageService.isValidJpeg(jpegBuffer)) {
                console.log('⚠️ JPEG data is corrupted, serving placeholder image');

                const placeholderJpeg = this.imageService.createPlaceholderJpeg();

                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Content-Length', placeholderJpeg.length);
                res.setHeader('X-Placeholder', 'true'); // Indicate this is a placeholder
                res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes only
                res.send(placeholderJpeg);
                return;
            }

            // Set appropriate headers for JPEG
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
            res.setHeader('Content-Length', jpegBuffer.length);

            // Override CORS policy for images to allow cross-origin loading
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

            if (frameMetadata && frameMetadata.original_name) {
                res.setHeader('Content-Disposition', `inline; filename="${frameMetadata.original_name}"`);
            }

            // Send the binary JPEG data
            res.send(jpegBuffer);

        } catch (error) {
            console.error('JPEG serving error:', error);

            if (error.message.includes('not found')) {
                res.status(404).json(createErrorResponse('Detection not found', 'DETECTION_NOT_FOUND'));
            } else {
                res.status(500).json(createErrorResponse('Failed to serve JPEG data', 'SERVE_JPEG_ERROR', error.message));
            }
        }
    }

    /**
     * Serve uploaded image files from filesystem
     */
    async serveImageFile(req, res) {
        try {
            const filename = req.params.filename;
            const { uploadsDir } = require('../../../middleware/upload');

            const imageInfo = this.imageService.serveImageFile(filename, uploadsDir);

            // Set headers
            Object.entries(imageInfo.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Stream the file
            const fs = require('fs');
            const fileStream = fs.createReadStream(imageInfo.path);
            fileStream.pipe(res);

        } catch (error) {
            console.error('Image serving error:', error);

            if (error.message.includes('not found')) {
                res.status(404).json(createErrorResponse('Image not found', 'IMAGE_NOT_FOUND'));
            } else {
                res.status(500).json(createErrorResponse('Failed to serve image', 'SERVE_IMAGE_ERROR', error.message));
            }
        }
    }

    /**
     * Test JPEG data format for debugging
     */
    async testJpegFormat(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            const { jpegData } = await this.imageService.getDetectionJpeg(detectionId);

            if (!jpegData) {
                return res.json({ error: 'Detection not found' });
            }

            res.json({
                detection_id: detectionId,
                jpeg_data_type: typeof jpegData,
                jpeg_data_preview: jpegData ?
                    (typeof jpegData === 'string' ?
                        jpegData.substring(0, 100) :
                        JSON.stringify(jpegData).substring(0, 100)) : null,
                has_jpeg: !!jpegData
            });

        } catch (error) {
            res.json({ error: error.message });
        }
    }

    /**
     * Get system metrics for a specific detection (mock data)
     */
    async getDetectionMetrics(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            // Return mock metrics data
            const mockMetrics = {
                detection_id: detectionId,
                timestamp: new Date().toISOString(),
                confidence_score: 85,
                threat_level: 7,
                device_type: 'ARCIS Camera',
                device_id: '1',
                cpu_usage: 45,
                gpu_usage: 60,
                ram_usage: 55,
                cpu_temp: 65,
                gpu_temp: 70,
                cpu_voltage: 1.2,
                gpu_voltage: 1.1,
                network_status: 'Connected',
                network_speed: 100,
                network_signal_strength: -45,
                disk_usage: 30,
                detection_latency: 250,
                distance_to_detection: 5.2,
                database_status: 'Connected',
                alert_played: true,
                raw_system_metrics: {},
                raw_metadata: {}
            };

            res.json({
                success: true,
                metrics: mockMetrics,
                message: 'System metrics retrieved successfully'
            });

        } catch (error) {
            console.error('Error getting detection metrics:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve detection metrics', 'GET_METRICS_ERROR', error.message));
        }
    }
}

module.exports = ImageController;
