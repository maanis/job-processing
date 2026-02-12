const mongoose = require('mongoose');

const processingJobSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    jobStatus: {
        type: String,
        enum: ['queued', 'processing', 'failed', 'completed', 'completed_with_errors'],
        default: 'queued',
        required: true
    },
    totalRows: {
        type: Number
    },
    processedRows: { type: Number, default: 0 },
    successRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    failedRowsPath: {
        type: String,
        default: null
    },
    reportsGenerated: { type: Number, default: 0 },
    directorshipStatus: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
    },
    directorshipReportStatus: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
    },

    inputCsvPath: {
        type: String
    },
    outputCsvPath: {
        type: String
    },
    reportZipPath: {
        type: String
    },
    errorMessage: {
        type: String
    },
    retryCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
});

// Indexes
processingJobSchema.index({ clientId: 1 });
processingJobSchema.index({ jobStatus: 1 });
processingJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobProcessingModel', processingJobSchema);