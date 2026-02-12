const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed! (jpeg, jpg, png, gif, webp)'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

// Single file upload
const uploadSingle = upload.single('image');

// Multiple files upload (up to 5 images)
const uploadMultiple = upload.array('images', 5);

// Profile picture upload (single file)
const uploadProfile = upload.single('profileImage');

// Attendance image upload (single file)
const uploadAttendance = upload.single('faceImage');

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadProfile,
    uploadAttendance
};