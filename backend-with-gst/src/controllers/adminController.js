const fs = require('fs');
const path = require('path');
const JobProcessingModel = require('../models/JobProcessingModel');

// ========================================
// Parse timestamp like:
// 2026-02-12 07:40:39 pm
// ========================================
function parseTimestampString(ts) {
    if (!ts) return null;

    ts = ts.trim();

    const match = ts.match(
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)$/i
    );

    if (!match) return null;

    let [, yy, mm, dd, h, min, s, ampm] = match;

    yy = Number(yy);
    mm = Number(mm);
    dd = Number(dd);
    h = Number(h);
    min = Number(min);
    s = Number(s);

    ampm = ampm.toLowerCase();

    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;

    return new Date(yy, mm - 1, dd, h, min, s);
}

// ========================================
// Build date range
// ========================================
function buildRange(from, to) {
    let fromDate = null;
    let toDate = null;

    if (from) {
        fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
    }

    if (to) {
        toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
    }

    return { fromDate, toDate };
}

// ========================================
// Download Processed Rows
// ========================================
const downloadProcessedRows = async (req, res) => {
    try {
        const { from, to } = req.query;
        const { fromDate, toDate } = buildRange(from, to);

        const processedFile = path.join(
            process.cwd(),
            'data',
            'processedRows',
            'processed_rows.csv'
        );

        if (!fs.existsSync(processedFile)) {
            return res.status(404).json({ error: 'Processed rows file not found' });
        }

        const content = fs.readFileSync(processedFile, 'utf-8');
        const lines = content.split(/\r?\n/).filter(Boolean);

        if (lines.length === 0) {
            return res.status(200).send('');
        }

        const header = lines[0];
        const dataLines = lines.slice(1);

        const filtered = dataLines.filter(line => {
            const idx = line.lastIndexOf(',');
            if (idx === -1) return false;

            const tsStr = line.substring(idx + 1).trim();
            const dt = parseTimestampString(tsStr);

            if (!dt) return false;
            if (fromDate && dt < fromDate) return false;
            if (toDate && dt > toDate) return false;

            return true;
        });

        const output = [header, ...filtered].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="processed_rows_${from || 'all'}_${to || 'all'}.csv"`
        );

        res.send(output);

    } catch (err) {
        console.error('downloadProcessedRows error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ========================================
// Download Failed Rows
// ========================================
const downloadFailedRows = async (req, res) => {
    try {
        const { from, to } = req.query;
        const { fromDate, toDate } = buildRange(from, to);

        const failedFile = path.join(
            process.cwd(),
            'data',
            'failedRows',
            'failed_rows.csv'
        );

        if (!fs.existsSync(failedFile)) {
            return res.status(404).json({ error: 'Failed rows file not found' });
        }

        const content = fs.readFileSync(failedFile, 'utf-8');
        const lines = content.split(/\r?\n/).filter(Boolean);

        if (lines.length === 0) {
            return res.status(200).send('');
        }

        const header = lines[0];
        const dataLines = lines.slice(1);

        const filtered = dataLines.filter(line => {
            const idx = line.lastIndexOf(',');
            if (idx === -1) return false;

            const tsStr = line.substring(idx + 1).trim();
            const dt = parseTimestampString(tsStr);

            if (!dt) return false;
            if (fromDate && dt < fromDate) return false;
            if (toDate && dt > toDate) return false;

            return true;
        });

        const output = [header, ...filtered].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="failed_rows_${from || 'all'}_${to || 'all'}.csv"`
        );

        res.send(output);

    } catch (err) {
        console.error('downloadFailedRows error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    downloadProcessedRows,
    downloadFailedRows
};
