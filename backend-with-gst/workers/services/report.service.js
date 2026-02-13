const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Use python3 on Linux, or allow override via environment variable
const PYTHON_CMD = process.env.PYTHON_CMD || "python3";

async function generateReports(outputCsvPath, jobId) {
    const jobDir = path.dirname(outputCsvPath);
    const zipPath = path.join(jobDir, "reports.zip");

    return new Promise((resolve, reject) => {
        const process = spawn(PYTHON_CMD, [
            "python/directorship_reports_updated_fast.py",
            outputCsvPath,
            zipPath
        ], { cwd: path.join(__dirname, "../../") });

        process.stdout.on("data", (data) => {
            console.log(`[PYTHON REPORT]: ${data.toString()}`);
        });

        process.stderr.on("data", (data) => {
            console.error(`[PYTHON REPORT ERROR]: ${data.toString()}`);
        });

        process.on("close", (code) => {
            console.log(`Python report process exited with code ${code}`);
            if (code === 0) {
                resolve(zipPath);
            } else {
                reject(new Error(`Python report generation failed with code ${code}`));
            }
        });

        process.on("error", (err) => {
            console.error(`Failed to start Python report process: ${err.message}`);
            reject(err);
        });
    });
}

module.exports = { generateReports };
