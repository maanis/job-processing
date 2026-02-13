const fs = require("fs");
const path = require("path");

const JobProcessingModel = require("../../src/models/JobProcessingModel.js");
const { runPythonScript } = require("../services/python.service.js");

// Use python3 on Linux, or allow override via environment variable
const PYTHON_CMD = process.env.PYTHON_CMD || "python3";

// Global failed rows file
const GLOBAL_FAILED_FILE = path.join(
  process.cwd(),
  "data",
  "failedRows",
  "failed_rows.csv",
);

const GLOBAL_FAILED_HEADER =
  "Ref No,Candidate Name,PAN,jobId,error,Timestamp\n";

// Global processed rows file
const GLOBAL_PROCESSED_FILE = path.join(
  process.cwd(),
  "data",
  "processedRows",
  "processed_rows.csv",
);

const GLOBAL_PROCESSED_HEADER =
  "Ref No,Candidate Name,PAN,DIN,GST,Status,Timestamp\n";

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

      // Read global file and ensure it has the Timestamp column; if missing, rewrite existing rows with IST timestamp
      let globalContent = fs.readFileSync(GLOBAL_FAILED_FILE, "utf-8");
      const allLines = globalContent.split(/\r?\n/).filter(Boolean);
      if (allLines.length === 0) {
        // empty file -> write header
        fs.writeFileSync(GLOBAL_FAILED_FILE, GLOBAL_FAILED_HEADER);
        globalContent = GLOBAL_FAILED_HEADER;
      } else {
        const currentHeader = allLines[0];
        if (!/timestamp/i.test(currentHeader)) {
          // generate IST timestamp for existing rows
          const now = new Date();
          const options = {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          };
          const istString = now.toLocaleString("en-IN", options);
          const parts = istString.split(", ");
          const date = parts[0].split("/").reverse().join("-");
          const time = parts[1];
          const timestamp = date + " " + time;

          const existingData = allLines
            .slice(1)
            .map((line) => line.replace(/\r/g, "").trim())
            .filter(Boolean);
          const updatedData = existingData.map(
            (line) => line + "," + timestamp,
          );
          const newContent =
            GLOBAL_FAILED_HEADER +
            (updatedData.length ? updatedData.join("\n") + "\n" : "");
          fs.writeFileSync(GLOBAL_FAILED_FILE, newContent, "utf-8");
          globalContent = newContent;
        }
      }

      // Prevent duplicate append for same jobId
      if (!globalContent.includes(jobId)) {
        const lines = jobFailedCsv.split("\n");
        const dataLines = lines.slice(1).filter((line) => line.trim());

        if (dataLines.length > 0) {
          // Generate IST timestamp
          const now = new Date();
          const options = {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          };
          const istString = now.toLocaleString("en-IN", options);
          const parts = istString.split(", ");
          const date = parts[0].split("/").reverse().join("-");
          const time = parts[1];
          const timestamp = date + " " + time;

          // Append timestamp to each row
          const dataWithTimestamp = dataLines
            .map((line) => line.replace(/\r/g, "").trim() + "," + timestamp)
            .join("\n");

          fs.appendFileSync(GLOBAL_FAILED_FILE, dataWithTimestamp + "\n");
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
    // STORE FAILED ROWS PATH IF FAILED ROWS EXIST
    // --------------------------------------------------
    if (failedRows > 0) {
      const failedRowsPath = path.join(jobDir, "failed_rows.csv");
      await JobProcessingModel.findByIdAndUpdate(jobId, {
        failedRowsPath,
      });
    }

    // --------------------------------------------------
    // STEP 2: PDF GENERATION
    // --------------------------------------------------
    const zipPath = path.join(jobDir, "reports.zip");

    // Initialize reportsGenerated to 0
    await JobProcessingModel.findByIdAndUpdate(jobId, { reportsGenerated: 0 });

    await new Promise((resolve, reject) => {
      const process = require("child_process").spawn(
        PYTHON_CMD,
        ["python/directorship_reports_updated_fast.py", outputCsvPath, zipPath],
        { cwd: path.join(__dirname, "../../") },
      );

      process.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[PYTHON REPORT]: ${output}`);

        // Increment counter on each PDF generation
        if (output.includes("Converting to PDF")) {
          JobProcessingModel.findByIdAndUpdate(jobId, {
            $inc: { reportsGenerated: 1 },
          }).catch((err) =>
            console.error("Failed to update reportsGenerated:", err),
          );
        }
      });

      process.stderr.on("data", (data) => {
        console.error(`[PYTHON REPORT ERROR]: ${data.toString()}`);
      });

      process.on("close", (code) => {
        console.log(`Python report process exited with code ${code}`);
        if (code === 0) {
          resolve(zipPath);
        } else {
          reject(
            new Error(`Python report generation failed with code ${code}`),
          );
        }
      });

      process.on("error", (err) => {
        console.error(`Failed to start Python report process: ${err.message}`);
        reject(err);
      });
    });

    const completedAt = new Date();

    await JobProcessingModel.findByIdAndUpdate(jobId, {
      directorshipReportStatus: "completed",
      reportZipPath: zipPath,
      jobStatus: failedRows > 0 ? "completed_with_errors" : "completed",
      completedAt,
    });

    // --------------------------------------------------
    // APPEND SUCCESSFUL ROWS TO GLOBAL PROCESSED FILE
    // --------------------------------------------------
    const jobStatus = failedRows > 0 ? "completed_with_errors" : "completed";
    if (jobStatus === "completed" || jobStatus === "completed_with_errors") {
      fs.mkdirSync(path.dirname(GLOBAL_PROCESSED_FILE), { recursive: true });

      if (!fs.existsSync(GLOBAL_PROCESSED_FILE)) {
        fs.writeFileSync(GLOBAL_PROCESSED_FILE, GLOBAL_PROCESSED_HEADER);
      }

      const outputContent = fs.readFileSync(outputCsvPath, "utf-8");
      const lines = outputContent.split("\n").slice(1); // Skip header
      const options = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      const istString = completedAt.toLocaleString("en-IN", options);
      const parts = istString.split(", ");
      const date = parts[0].split("/").reverse().join("-");
      const time = parts[1];
      const timestamp = date + " " + time;
      const dataWithTimestamp = lines
        .map((line) => {
          const cleanedLine = line.replace(/\r/g, "").trim();
          return cleanedLine ? cleanedLine + "," + timestamp : "";
        })
        .filter((line) => line)
        .join("\n");

      if (dataWithTimestamp) {
        fs.appendFileSync(GLOBAL_PROCESSED_FILE, dataWithTimestamp + "\n");
      }
    }
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
