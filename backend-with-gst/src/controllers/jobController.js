const fs = require('fs');
const path = require('path');
const ProcessingJob = require('../models/JobProcessingModel');
const jobQueue = require('../queues/job.queue');
const { validateFileStructure, getFileType } = require('../utils/fileValidator');
const { convertToCsv } = require('../utils/excelToCsv');

const getJob = async (req, res) => {
    try {
        const clientId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalJobs = await ProcessingJob.countDocuments({ clientId });

        // Get jobs with pagination, sorted by creation date (newest first)
        const jobs = await ProcessingJob.find({ clientId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalJobs / limit);

        res.json({
            jobs,
            pagination: {
                currentPage: page,
                totalPages,
                totalJobs,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const processJob = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const clientId = req.user.id; // From auth middleware

        // Validate file type
        const fileType = getFileType(file.originalname);
        if (!fileType) {
            return res.status(400).json({ error: 'Only CSV and Excel files (.csv, .xlsx, .xls) are allowed' });
        }

        // Validate file structure first
        const validation = validateFileStructure(file.path, fileType);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Create job record first to get jobId
        const job = new ProcessingJob({
            clientId,
            originalFileName: file.originalname,
            jobStatus: 'queued'
        });

        await job.save();

        // Create job directory
        const jobDir = path.join(__dirname, '../../data/jobs', job._id.toString());
        if (!fs.existsSync(jobDir)) {
            fs.mkdirSync(jobDir, { recursive: true });
        }

        // Always store as CSV
        const inputCsvPath = path.join(jobDir, 'input.csv');

        // Convert Excel to CSV or move CSV directly
        if (fileType === 'excel') {
            const success = convertToCsv(file.path, inputCsvPath);
            if (!success) {
                return res.status(500).json({ error: 'Failed to convert Excel file to CSV' });
            }
            // Clean up original Excel file
            fs.unlinkSync(file.path);
        } else {
            // Move CSV file directly
            fs.renameSync(file.path, inputCsvPath);
        }

        // Count total rows from the final CSV file
        const csvContent = fs.readFileSync(inputCsvPath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const totalRows = lines.length > 0 ? lines.length - 1 : 0;

        // Update job with file path and row count
        job.inputCsvPath = inputCsvPath;
        job.totalRows = totalRows;
        await job.save();

        // Add to queue
        await jobQueue.add(
            'processFile', {
            jobId: job._id.toString(),
            file: inputCsvPath,
            clientId
        },
            {
                attempts: 3
            }
        );


        res.status(201).json({
            message: 'Job created successfully',
            job: {
                id: job._id,
                status: job.jobStatus,
                totalRows,
                createdAt: job.createdAt
            }
        });

    } catch (error) {
        console.error('Process job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clientId = req.user.id;

        const job = await ProcessingJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.clientId.toString() !== clientId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const data = {
            jobStatus: job.jobStatus,
            totalRows: job.totalRows,
            processedRows: job.processedRows,
            successRows: job.successRows,
            failedRows: job.failedRows,
            reportsGenerated: job.reportsGenerated,
            directorshipStatus: job.directorshipStatus,
            directorshipReportStatus: job.directorshipReportStatus,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            errorMessage: job.errorMessage
        };

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get job status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const downloadOutputCsv = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clientId = req.user.id;

        const job = await ProcessingJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.clientId.toString() !== clientId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        if (!job.outputCsvPath || !fs.existsSync(job.outputCsvPath)) {
            return res.status(404).json({ success: false, message: 'Output file not found' });
        }

        const fileName = `output_${jobId}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const fileStream = fs.createReadStream(job.outputCsvPath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download output CSV error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const downloadReportsZip = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clientId = req.user.id;

        const job = await ProcessingJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.clientId.toString() !== clientId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        if (!job.reportZipPath || !fs.existsSync(job.reportZipPath)) {
            return res.status(404).json({ success: false, message: 'Reports ZIP file not found' });
        }

        const fileName = `reports_${jobId}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const fileStream = fs.createReadStream(job.reportZipPath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download reports ZIP error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const downloadFailedRowsCsv = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clientId = req.user.id;

        const job = await ProcessingJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.clientId.toString() !== clientId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        if (!job.failedRowsPath || !fs.existsSync(job.failedRowsPath)) {
            return res.status(404).json({ success: false, message: 'Failed rows file not found' });
        }

        const fileName = `failed_rows_${jobId}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const fileStream = fs.createReadStream(job.failedRowsPath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download failed rows CSV error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { processJob, getJob, getJobStatus, downloadOutputCsv, downloadReportsZip, downloadFailedRowsCsv };
