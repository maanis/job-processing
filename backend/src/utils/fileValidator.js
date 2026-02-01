const fs = require('fs');
const XLSX = require('xlsx');

const validateFileStructure = (filePath, fileType) => {
    try {
        let data;

        if (fileType === 'csv') {
            // Read CSV
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
                return { isValid: false, error: 'File is empty' };
            }

            // Parse header
            const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
            data = [header];
        } else if (fileType === 'excel') {
            // Read Excel
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to array of arrays
            data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (data.length === 0) {
                return { isValid: false, error: 'File is empty' };
            }
        } else {
            return { isValid: false, error: 'Unsupported file type' };
        }

        // Get header row
        const header = data[0];
        if (!header || header.length === 0) {
            return { isValid: false, error: 'No header row found' };
        }

        // Required columns (case insensitive)
        const requiredColumns = ['ref no', 'candidate name', 'pan'];
        const headerLower = header.map(col => (col || '').toString().toLowerCase().trim());

        // Check if all required columns are present
        const missingColumns = requiredColumns.filter(col =>
            !headerLower.includes(col.toLowerCase())
        );

        if (missingColumns.length > 0) {
            return {
                isValid: false,
                error: `Missing required columns: ${missingColumns.join(', ')}. Found columns: ${header.join(', ')}`
            };
        }

        // Check for extra columns (optional, but warn)
        const extraColumns = headerLower.filter(col =>
            !requiredColumns.includes(col.toLowerCase())
        );

        // Check if exactly 3 columns
        if (header.length !== 3) {
            return {
                isValid: false,
                error: `File must have exactly 3 columns. Found ${header.length} columns: ${header.join(', ')}`
            };
        }

        // Check for duplicate columns
        const uniqueHeaders = new Set(headerLower);
        if (uniqueHeaders.size !== header.length) {
            return {
                isValid: false,
                error: 'Duplicate column names found'
            };
        }

        return {
            isValid: true,
            columns: header,
            extraColumns: extraColumns.length > 0 ? extraColumns : null
        };

    } catch (error) {
        return {
            isValid: false,
            error: `Error reading file: ${error.message}`
        };
    }
};

const getFileType = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'csv') return 'csv';
    if (['xlsx', 'xls'].includes(ext)) return 'excel';
    return null;
};

module.exports = { validateFileStructure, getFileType };