import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, FileText, AlertCircle, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Modal } from '@/components/Modal';
import { uploadJob } from '@/api/uploadJob';

interface UploadJobModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ParsedData {
    headers: string[];
    rows: string[][];
}

const REQUIRED_HEADERS = ['Ref No', 'Candidate Name', 'PAN'];

export function UploadJobModal({ isOpen, onClose }: UploadJobModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValidFormat, setIsValidFormat] = useState(false);

    const queryClient = useQueryClient();

    // ================================
    // SAMPLE CSV DOWNLOAD
    // ================================
    const downloadSampleCSV = () => {
        const sampleRows = [
            ['REF001', 'John Doe', 'ABCDE1234F'],
            ['REF002', 'Jane Smith', 'PQRSX6789K'],
        ];

        const csvContent =
            [REQUIRED_HEADERS, ...sampleRows]
                .map(row => row.join(','))
                .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sample_bulk_upload.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ================================
    // HEADER VALIDATION
    // ================================
    const validateHeaders = (headers: string[]) => {
        const normalized = headers.map(h => h.trim());
        const valid = REQUIRED_HEADERS.every(header =>
            normalized.includes(header)
        );
        setIsValidFormat(valid);
        if (!valid) {
            setError('Invalid file format. Please use the sample template.');
        }
    };

    // ================================
    // FILE PARSER
    // ================================
    const parseFile = useCallback(async (file: File) => {
        setError(null);
        setIsValidFormat(false);

        try {
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    complete: (results) => {
                        if (results.errors.length > 0 || !results.data.length) {
                            setError('Failed to parse CSV file');
                            return;
                        }

                        const headers = results.data[0] as string[];
                        validateHeaders(headers);

                        const rows = (results.data.slice(1, 11) as string[][])
                            .filter(row => row.some(cell => cell?.trim() !== ''));

                        setParsedData({ headers, rows });
                    },
                    header: false,
                    skipEmptyLines: true,
                });
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

                if (!jsonData.length) {
                    setError('Excel file is empty');
                    return;
                }

                const headers = jsonData[0];
                validateHeaders(headers);

                const rows = jsonData.slice(1, 11)
                    .filter(row => row.some(cell => cell && cell.toString().trim() !== ''));

                setParsedData({ headers, rows });
            } else {
                setError('Unsupported file type');
            }
        } catch {
            setError('Failed to parse file');
        }
    }, []);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setParsedData(null);
        parseFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !isValidFormat) return;

        setIsUploading(true);
        setError(null);

        try {
            await uploadJob(selectedFile);
            await queryClient.invalidateQueries({ queryKey: ['jobs'] });

            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setParsedData(null);
        setError(null);
        setIsValidFormat(false);
        onClose();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setParsedData(null);
        setError(null);
        setIsValidFormat(false);
    }
    // ================================
    // UI
    // ================================
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Upload CSV or Excel"
            className="max-w-lg p-5"
        >
            <div className="space-y-5">

                {/* Drag & Drop */}
                <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/60 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">Drop file or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                        Supports CSV, XLSX, XLS
                    </p>
                    <input
                        id="file-input"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                        }}
                    />
                </div>

                {/* Expected Format */}
                <div className="p-4 bg-secondary/40 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Expected Format</p>
                        <button
                            onClick={downloadSampleCSV}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                            <Download className="h-3 w-3" />
                            Sample CSV
                        </button>
                    </div>
                    <div className="text-xs font-mono bg-secondary/60 p-2 rounded">
                        Ref No, Candidate Name, PAN
                    </div>
                </div>

                {/* Selected File */}
                {selectedFile && (
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <p className="text-sm truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={() => handleRemoveFile()}
                            className="p-1 hover:bg-secondary rounded-lg"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-xs text-destructive">{error}</p>
                    </div>
                )}

                {/* Preview */}
                {parsedData && (
                    <div>
                        <p className="text-sm font-medium mb-2">Preview</p>
                        <div className="border rounded-lg overflow-auto max-h-56">
                            <table className="w-full text-xs">
                                <thead className="bg-secondary/50 sticky top-0">
                                    <tr>
                                        {parsedData.headers.map((header, i) => (
                                            <th key={i} className="px-2 py-1 text-left uppercase text-muted-foreground">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.rows.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-t">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-2 py-1">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || !isValidFormat || isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload Job'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
