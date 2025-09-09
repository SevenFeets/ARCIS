const fs = require('fs');
const path = require('path');

/**
 * Image Service - Handles image processing and storage
 */
class ImageService {
    constructor() {
        this.supabase = require('../../../config/supabase').supabase;
    }

    /**
     * Process uploaded JPEG file and return buffer
     * @param {Object} file - Multer file object
     * @returns {Promise<Object>} Processing result with buffer and metadata
     */
    async processUploadedJpeg(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        // Validate file type
        if (!file.mimetype.includes('jpeg') && !file.mimetype.includes('jpg')) {
            throw new Error(`Invalid file type: ${file.mimetype}. Only JPEG/JPG files are supported`);
        }

        // Read the binary JPEG data
        const jpegBuffer = fs.readFileSync(file.path);

        // Create frame metadata
        const frameMetadata = {
            original_name: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            format: 'jpeg',
            uploaded_at: new Date().toISOString()
        };

        console.log(`📸 JPEG file processed: ${jpegBuffer.length} bytes`);

        return {
            buffer: jpegBuffer,
            metadata: frameMetadata,
            base64: jpegBuffer.toString('base64')
        };
    }

    /**
     * Clean up uploaded file from filesystem
     * @param {string} filePath - Path to file to delete
     */
    cleanupUploadedFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up uploaded file: ${filePath}`);
            }
        } catch (error) {
            console.warn('File cleanup warning:', error.message);
        }
    }

    /**
     * Get JPEG data from detection record
     * @param {number} detectionId - Detection ID
     * @returns {Promise<Object>} JPEG data and metadata
     */
    async getDetectionJpeg(detectionId) {
        const { data, error } = await this.supabase
            .from('detections')
            .select('detection_frame_jpeg, frame_metadata, detection_frame_data')
            .eq('detection_id', detectionId)
            .single();

        if (error) {
            throw new Error(`Failed to retrieve detection: ${error.message}`);
        }

        if (!data) {
            throw new Error('Detection not found');
        }

        return {
            jpegData: data.detection_frame_jpeg,
            frameMetadata: data.frame_metadata,
            legacyFrameData: data.detection_frame_data
        };
    }

    /**
     * Convert various JPEG data formats to buffer
     * @param {*} jpegData - JPEG data in various formats
     * @returns {Buffer|null} JPEG buffer or null if conversion fails
     */
    convertToJpegBuffer(jpegData) {
        if (!jpegData) {
            return null;
        }

        console.log('🔍 Debug JPEG data format:', {
            type: typeof jpegData,
            isBuffer: Buffer.isBuffer(jpegData),
            hasTypeProperty: jpegData && jpegData.type,
            preview: typeof jpegData === 'string' ? jpegData.substring(0, 50) : 'not-string'
        });

        let jpegBuffer;

        if (Buffer.isBuffer(jpegData)) {
            // Already a Buffer
            console.log('📦 Using existing Buffer');
            jpegBuffer = jpegData;
        } else if (jpegData && jpegData.type === 'Buffer' && Array.isArray(jpegData.data)) {
            // Supabase returns Buffer as {type: 'Buffer', data: [array]}
            console.log('🔄 Converting from Supabase Buffer format');
            jpegBuffer = Buffer.from(jpegData.data);
        } else if (typeof jpegData === 'string') {
            console.log('📝 Processing string JPEG data');

            if (jpegData.startsWith('x') || jpegData.startsWith('\\x')) {
                console.log('🔍 Detected hex-encoded data, attempting to decode...');
                try {
                    // Handle both 'x' and '\x' prefixes
                    const hexString = jpegData.startsWith('\\x')
                        ? jpegData.substring(2) // Remove '\x' prefix
                        : jpegData.substring(1); // Remove 'x' prefix

                    const decodedString = Buffer.from(hexString, 'hex').toString('utf8');
                    console.log('📋 Decoded string preview:', decodedString.substring(0, 100));

                    // Check if it's a JSON Buffer or base64 string
                    if (decodedString.startsWith('{') && decodedString.includes('"type":"Buffer"')) {
                        // Hex-encoded Buffer JSON
                        console.log('🔄 Processing as hex-encoded Buffer JSON');
                        const bufferData = JSON.parse(decodedString);
                        if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                            console.log('✅ Successfully parsed hex-encoded Buffer JSON');
                            jpegBuffer = Buffer.from(bufferData.data);
                        } else {
                            throw new Error('Invalid Buffer JSON structure');
                        }
                    } else if (decodedString.startsWith('/9j') || decodedString.startsWith('iVBOR')) {
                        // Hex-encoded base64 string
                        console.log('📝 Processing as hex-encoded base64 string');
                        jpegBuffer = Buffer.from(decodedString, 'base64');
                    } else {
                        throw new Error('Unknown decoded data format');
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse hex-encoded data:', parseError.message);
                    jpegBuffer = null;
                }
            } else {
                // Regular base64 string
                console.log('📝 Converting from base64 string');
                jpegBuffer = Buffer.from(jpegData, 'base64');
            }
        } else {
            console.error('❌ Unknown JPEG data format:', typeof jpegData);
            return null;
        }

        // Validate buffer
        if (!jpegBuffer || jpegBuffer.length === 0) {
            console.error('❌ JPEG buffer is null or empty');
            return null;
        }

        console.log('📸 Final JPEG buffer:', {
            length: jpegBuffer.length,
            firstBytes: jpegBuffer.slice(0, 4).toString('hex'),
            isValidJPEG: jpegBuffer.slice(0, 2).toString('hex') === 'ffd8'
        });

        return jpegBuffer;
    }

    /**
     * Validate JPEG buffer
     * @param {Buffer} buffer - JPEG buffer to validate
     * @returns {boolean} True if valid JPEG
     */
    isValidJpeg(buffer) {
        if (!buffer || buffer.length < 2) {
            return false;
        }

        // Check JPEG magic number (0xFFD8)
        return buffer.slice(0, 2).toString('hex') === 'ffd8';
    }

    /**
     * Create placeholder JPEG for corrupted images
     * @returns {Buffer} Placeholder JPEG buffer
     */
    createPlaceholderJpeg() {
        // Simple red warning placeholder JPEG
        return Buffer.from([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x64,
            0x00, 0x64, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
            0xFF, 0xC4, 0x00, 0x15, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF,
            0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00,
            0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00,
            // Red pixel data (simplified)
            0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0xFF, 0xD9
        ]);
    }

    /**
     * Get frame data for detection (legacy support)
     * @param {number} detectionId - Detection ID
     * @returns {Promise<Object>} Frame data response
     */
    async getDetectionFrame(detectionId) {
        const { jpegData, legacyFrameData } = await this.getDetectionJpeg(detectionId);

        let frameData = null;

        // Priority 1: Use legacy detection_frame_data if available
        if (legacyFrameData) {
            console.log('📸 Using legacy detection_frame_data');
            frameData = legacyFrameData;
        }
        // Priority 2: Convert binary JPEG to base64 for fallback
        else if (jpegData) {
            console.log('📸 Converting binary JPEG to base64 for legacy API');

            const jpegBuffer = this.convertToJpegBuffer(jpegData);

            if (jpegBuffer && this.isValidJpeg(jpegBuffer)) {
                // Convert to base64 data URL
                const base64Data = jpegBuffer.toString('base64');
                frameData = `data:image/jpeg;base64,${base64Data}`;
                console.log(`✅ Created valid JPEG data URL (${jpegBuffer.length} bytes)`);
            } else {
                console.log('❌ No valid JPEG buffer created');
            }
        }

        if (!frameData) {
            throw new Error('No frame data available for this detection');
        }

        return { frameData };
    }

    /**
     * Serve image file from uploads directory
     * @param {string} filename - Image filename
     * @param {string} uploadsDir - Uploads directory path
     * @returns {Object} File stream and headers
     */
    serveImageFile(filename, uploadsDir) {
        const imagePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error('Image not found');
        }

        // Determine MIME type
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };

        const mimeType = mimeTypes[ext] || 'image/jpeg';

        return {
            path: imagePath,
            mimeType,
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
            }
        };
    }
}

module.exports = ImageService;
