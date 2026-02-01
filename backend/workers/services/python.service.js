const { spawn } = require("child_process");

const runPythonScript = (file, jobId) => {
    return new Promise((resolve, reject) => {
        const process = spawn("python", [
            "python/directorship_bulk.py",
            file,
            jobId
        ]);

        process.stdout.on("data", (data) => {
            console.log(`[PYTHON]: ${data.toString()}`);
        });

        process.stderr.on("data", (data) => {
            console.error(`[PYTHON ERROR]: ${data.toString()}`);
        });

        process.on("close", (code) => {
            console.log(`Python process exited with code ${code}`);
            if (code === 0) resolve();
            else reject(new Error(`Python process failed with code ${code}`));
        });

        process.on("error", (err) => {
            console.error(`Failed to start Python process: ${err.message}`);
            reject(err);
        });
    });
};

module.exports = { runPythonScript };
