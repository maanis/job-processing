const { Queue } = require('bullmq');
const redis = require('../config/redis');

const jobQueue = new Queue('processingJobs', {
    connection: redis,
});

module.exports = jobQueue;
