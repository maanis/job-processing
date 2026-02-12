const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { downloadProcessedRows, downloadFailedRows } = require('../controllers/adminController');

// GET /api/admin/download/processed_rows?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/download/processed_rows', auth, admin, downloadProcessedRows);

// GET /api/admin/download/failed_rows?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/download/failed_rows', auth, admin, downloadFailedRows);

module.exports = router;
