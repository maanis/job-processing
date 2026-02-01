const JobProcessingModel = require("../../src/models/JobProcessingModel.js");
const { runPythonScript } = require("../services/python.service.js");
const { generateReports } = require("../services/report.service.js");

const jobProcessor = async (job) => {
    const { jobId, file } = job.data;
    const outputCsvPath = file.replace("input.csv", "output.csv");

    try {
        await JobProcessingModel.findByIdAndUpdate(jobId, {
            jobStatus: "processing",
            startedAt: new Date(),
        });

        // -------- STEP 1: Python enrichment --------
        await runPythonScript(file, jobId);

        await JobProcessingModel.findByIdAndUpdate(jobId, {
            directorshipStatus: "completed",
            outputCsvPath,
        });

        // -------- STEP 2: PDF generation --------
        const zipPath = await generateReports(outputCsvPath, jobId);

        await JobProcessingModel.findByIdAndUpdate(jobId, {
            directorshipReportStatus: "completed",
            reportZipPath: zipPath,
            jobStatus: "completed",
            completedAt: new Date(),
        });

    } catch (err) {
        await JobProcessingModel.findByIdAndUpdate(jobId, {
            jobStatus: "failed",
            errorMessage: err.message,
        });

        console.log(err.message)

        throw err; // BullMQ retry
    }
};

module.exports = { jobProcessor };
