const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for detection frames
const uploadsDir = path.join(__dirname, '../uploads/detection-frames');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const extension = path.extname(file.originalname) || '.jpg';
        const filename = `detection_${timestamp}_${random}${extension}`;
        cb(null, filename);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    console.log('📸 Uploaded file:', file.originalname, 'Type:', file.mimetype);

    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPG, PNG, etc.)'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only one file at a time
    },
    fileFilter: fileFilter
});

// Export middleware
module.exports = {
    uploadSingle: upload.single('detection_frame'),
    uploadsDir
}; 