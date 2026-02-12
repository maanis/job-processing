const { Worker } = require("bullmq");
const { jobProcessor } = require("./processors/job.processor.js");
const redis = require("../src/config/redis.js");
const connectDB = require("../src/config/db.js");

const startJobWorker = async () => {
    await connectDB();

    new Worker(
        "processingJobs",
        jobProcessor,
        {
            connection: redis,
            concurrency: 1,

            // ✅ FIXED: must be objects
            removeOnComplete: { count: 10 },
            removeOnFail: { count: 5 },

            lockDuration: 300000,   // 5 min
            lockRenewTime: 60000,   // renew every 1 min
        }
    );

    console.log("Job worker started");
};

startJobWorker().catch(console.error);
