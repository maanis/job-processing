const { spawn } = require("child_process");
const JobProcessingModel = require("../../src/models/JobProcessingModel");

// Use python3 on Linux, or allow override via environment variable
const PYTHON_CMD = process.env.PYTHON_CMD || "python3";

const runPythonScript = (file, jobId) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_CMD, [
      "python/directorship_bulk.py",
      file,
      jobId,
    ]);

    let lastUpdated = 0;
    let buffer = "";

    pythonProcess.stdout.on("data", async (data) => {
      buffer += data.toString();

      const lines = buffer.split("\n");

      // Keep last incomplete line in buffer
      buffer = lines.pop();

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        console.log(`[PYTHON]: ${cleanLine}`);

        if (cleanLine.startsWith("PROGRESS:")) {
          const now = Date.now();

          // Throttle DB updates (1 sec)
          if (now - lastUpdated > 1000) {
            lastUpdated = now;

            try {
              const progressPart = cleanLine.replace("PROGRESS:", "").trim();

              const [processed, total] = progressPart.split("/").map(Number);

              if (Number.isInteger(processed) && Number.isInteger(total)) {
                await JobProcessingModel.findByIdAndUpdate(jobId, {
                  processedRows: processed,
                  totalRows: total,
                });
              }
            } catch (err) {
              console.error("Failed updating progress:", err.message);
            }
          }
        }
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR]: ${data.toString()}`);
    });

    pythonProcess.on("close", async (code) => {
      console.log(`Python process exited with code ${code}`);

      if (code === 0) {
        // Final safety update: ensure processedRows = totalRows
        try {
          const job = await JobProcessingModel.findById(jobId);
          if (job && job.totalRows) {
            job.processedRows = job.totalRows;
            await job.save();
          }
        } catch (err) {
          console.error("Final progress sync failed:", err.message);
        }

        resolve();
      } else {
        reject(new Error(`Python process failed with code ${code}`));
      }
    });

    pythonProcess.on("error", (err) => {
      console.error(`Failed to start Python process: ${err.message}`);
      reject(err);
    });
  });
};

module.exports = { runPythonScript };
