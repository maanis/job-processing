const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { processJob, getJob } = require('../controllers/jobController');

// Routes
router.get('/', auth, getJob);
router.post('/process', auth, uploadSingle('file'), processJob);
// router.get('/:id', auth, jobController.getJobById);
// router.get('/:id/download', auth, jobController.downloadResults);

module.exports = router;
