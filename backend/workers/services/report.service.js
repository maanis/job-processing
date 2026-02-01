const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const archiver = require("archiver");
const puppeteer = require("puppeteer");

const TEMPLATE_PATH = path.join(
    __dirname,
    "../../reportTemplate/directorship-report.html"
);

async function generateReports(outputCsvPath, jobId) {
    const jobDir = path.dirname(outputCsvPath);
    const reportsDir = path.join(jobDir, "reports");
    const zipPath = path.join(jobDir, "reports.zip");

    fs.mkdirSync(reportsDir, { recursive: true });

    const rows = await csv().fromFile(outputCsvPath);
    if (!rows.length) throw new Error("No rows found in output.csv");

    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf-8");

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
        for (const row of rows) {
            const page = await browser.newPage();

            await page.setContent(templateHtml, {
                waitUntil: "networkidle0"
            });

            // 🔒 SAFE DOM INJECTION
            await page.evaluate((data) => {
                const set = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = value || "N/A";
                };

                set("pan", data.pan);
                set("name", data.name);
                set("din", data.din);
                set("din-cell", data.din);
                set("gst", data.gst);
                set("status", data.status);
            }, {
                pan: row.PAN,
                name: row["Candidate Name"],
                din: row.DIN,
                gst: row.GST,
                status: row.Status
            });

            const safeFileName =
                `${row["Ref No"] || "REF"}-${row["Candidate Name"] || "UNKNOWN"}`
                    .replace(/[<>:"/\\|?*]/g, "")
                    .replace(/\s+/g, "_");

            const pdfPath = path.join(reportsDir, `${safeFileName}.pdf`);

            // ✅ MARGINS CONTROLLED HERE (CRITICAL FIX)
            await page.pdf({
                path: pdfPath,
                format: "A4",
                printBackground: true,
                margin: {
                    top: "16mm",
                    bottom: "16mm",
                    left: "14mm",
                    right: "14mm"
                }
            });

            await page.close();
        }
    } finally {
        await browser.close();
    }

    await zipFolder(reportsDir, zipPath);
    return zipPath;
}

function zipFolder(sourceDir, zipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", resolve);
        archive.on("error", reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

module.exports = { generateReports };
