const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getStorageProvider } = require('../lib/storageProvider');
const { requireAuth, requireAdmin } = require('../lib/auth');

// Ensure upload directory exists (used by both local storage AND as temp dir for cloud uploads)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage — always write to disk first (multer requirement)
// For cloud providers, the file is then uploaded to the cloud and the local copy is deleted.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (JPG/PNG only)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Route: POST /api/upload
router.post('/', requireAuth, requireAdmin, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        try {
            const provider = getStorageProvider(req);
            const filePath = req.file.path;
            const filename = req.file.filename;

            const result = await provider.upload(filePath, filename);

            res.status(201).json({
                url: result.url,
                storage: provider.getType(),
            });
        } catch (e) {
            console.error('Upload error:', e);
            res.status(500).json({ error: 'Image upload failed: ' + e.message });
        }
    });
});

module.exports = router;
