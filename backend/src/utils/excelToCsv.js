const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Convert Excel file to CSV format
 * @param {string} inputPath - Path to the Excel file
 * @param {string} outputPath - Path where CSV should be saved
 * @returns {boolean} - Success status
 */
const convertToCsv = (inputPath, outputPath) => {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(inputPath);

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to CSV string
        const csvData = XLSX.utils.sheet_to_csv(worksheet);

        // Write to output path
        fs.writeFileSync(outputPath, csvData, 'utf-8');

        return true;
    } catch (error) {
        console.error('Error converting Excel to CSV:', error);
        return false;
    }
};

module.exports = { convertToCsv };