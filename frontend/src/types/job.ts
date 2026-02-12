export interface CreatedJob {
    id: string;
    status: string;
    totalRows: number;
    createdAt: string;
}

export interface CreateJobResponse {
    message: string;
    job: CreatedJob;
}

export interface Job {
    _id: string;
    clientId: string;
    jobStatus: 'queued' | 'processing' | 'failed' | 'completed';
    totalRows?: number;
    processedRows: number;
    successRows: number;
    failedRows: number;
    reportsGenerated: number;
    directorshipStatus: 'pending' | 'running' | 'completed' | 'failed';
    directorshipReportStatus: 'pending' | 'running' | 'completed' | 'failed';
    inputCsvPath?: string;
    outputCsvPath?: string;
    reportZipPath?: string;
    errorMessage?: string;
    retryCount: number;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    originalFileName?: string;
}

export interface JobStatusResponse {
    success: boolean;
    data: {
        jobStatus: string;
        totalRows?: number;
        processedRows: number;
        successRows: number;
        failedRows: number;
        reportsGenerated: number;
        directorshipStatus: string;
        directorshipReportStatus: string;
        startedAt?: string;
        completedAt?: string;
        errorMessage?: string;
    };
}