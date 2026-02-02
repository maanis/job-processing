const fs = require("fs");
const path = require("path");

const JobProcessingModel = require("../../src/models/JobProcessingModel.js");
const { runPythonScript } = require("../services/python.service.js");
const { generateReports } = require("../services/report.service.js");

// Global failed rows file
const GLOBAL_FAILED_FILE = path.join(
    process.cwd(),
    "data",
    "failedRows",
    "failed_rows.csv"
);

const GLOBAL_FAILED_HEADER = "Ref No,Candidate Name,PAN,jobId,error\n";

const jobProcessor = async (job) => {
    const { jobId, file } = job.data;
    const outputCsvPath = file.replace("input.csv", "output.csv");
    const jobDir = path.dirname(file);

    try {
        // --------------------------------------------------
        // MARK JOB AS PROCESSING
        // --------------------------------------------------
        await JobProcessingModel.findByIdAndUpdate(jobId, {
            jobStatus: "processing",
            startedAt: new Date(),
        });

        // --------------------------------------------------
        // STEP 1: PYTHON ENRICHMENT (ROW-LEVEL RETRIES)
        // --------------------------------------------------
        await runPythonScript(file, jobId);

        await JobProcessingModel.findByIdAndUpdate(jobId, {
            directorshipStatus: "completed",
            outputCsvPath,
        });

        // --------------------------------------------------
        // APPEND FAILED ROWS TO GLOBAL FILE (AFTER PYTHON)
        // --------------------------------------------------
        const jobFailedRowsPath = path.join(jobDir, "failed_rows.csv");

        if (fs.existsSync(jobFailedRowsPath)) {
            const jobFailedCsv = fs.readFileSync(jobFailedRowsPath, "utf-8");

            // Ensure global folder + file exist
            fs.mkdirSync(path.dirname(GLOBAL_FAILED_FILE), { recursive: true });

            if (!fs.existsSync(GLOBAL_FAILED_FILE)) {
                fs.writeFileSync(GLOBAL_FAILED_FILE, GLOBAL_FAILED_HEADER);
            }

            const globalContent = fs.readFileSync(GLOBAL_FAILED_FILE, "utf-8");

            // Prevent duplicate append for same jobId
            if (!globalContent.includes(jobId)) {
                const lines = jobFailedCsv.split("\n");
                const dataOnly = lines.slice(1).join("\n").trim();

                if (dataOnly) {
                    fs.appendFileSync(GLOBAL_FAILED_FILE, dataOnly + "\n");
                }
            }
        }

        // --------------------------------------------------
        // UPDATE COUNTERS FROM SUMMARY.JSON
        // --------------------------------------------------
        const summaryPath = path.join(jobDir, "summary.json");
        let failedRows = 0;

        if (fs.existsSync(summaryPath)) {
            const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));

            failedRows = summary.failedRows;

            await JobProcessingModel.findByIdAndUpdate(jobId, {
                totalRows: summary.totalRows,
                successRows: summary.successRows,
                failedRows: summary.failedRows,
            });
        }

        // --------------------------------------------------
        // STEP 2: PDF GENERATION
        // --------------------------------------------------
        const zipPath = await generateReports(outputCsvPath, jobId);

        await JobProcessingModel.findByIdAndUpdate(jobId, {
            directorshipReportStatus: "completed",
            reportZipPath: zipPath,
            jobStatus: failedRows > 0 ? "completed_with_errors" : "completed",
            completedAt: new Date(),
        });

    } catch (err) {
        console.error("Job failed:", err.message);

        // --------------------------------------------------
        // ONLY INFRA ERRORS SHOULD RETRY
        // --------------------------------------------------
        const isInfraError =
            err.code === "ENOENT" ||
            err.message.includes("Redis") ||
            err.message.includes("spawn") ||
            err.message.includes("ECONNREFUSED");

        let errorMessage = err.message;

        // Check if all rows failed
        const summaryPath = path.join(jobDir, "summary.json");
        if (fs.existsSync(summaryPath)) {
            const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
            if (summary.totalRows === summary.failedRows) {
                errorMessage = "All rows failed to process";
            }
        }

        await JobProcessingModel.findByIdAndUpdate(jobId, {
            jobStatus: "failed",
            directorshipReportStatus: "failed",
            errorMessage,
        });

        if (isInfraError) {
            throw err; // BullMQ retry
        }

        // ❌ DO NOT THROW for business / data errors
    }
};

module.exports = { jobProcessor };
