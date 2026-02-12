const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { processJob, getJob, getJobStatus, downloadOutputCsv, downloadReportsZip, downloadFailedRowsCsv } = require('../controllers/jobController');

// Routes
router.get('/', auth, getJob);
router.post('/process', auth, uploadSingle('file'), processJob);
router.get('/:jobId/status', auth, getJobStatus);
router.get('/:jobId/download/csv', auth, downloadOutputCsv);
router.get('/:jobId/download/zip', auth, downloadReportsZip);
router.get('/:jobId/failed-rows', auth, downloadFailedRowsCsv);

// router.get('/:id/download', auth, jobController.downloadResults);

module.exports = router;
