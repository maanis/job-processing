import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export type JobStatus = 'queued' | 'processing' | 'failed' | 'completed';

export interface Job {
  _id: string;
  clientId: string;
  jobStatus: JobStatus;
  totalRows?: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  reportsGenerated: number;
  directorshipStatus: string;
  directorshipReportStatus: string;
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

export interface FailedRow {
  id: string;
  jobId: string;
  refNo: string;
  candidateName: string;
  pan: string;
  errorMessage: string;
}

export function useJobs(page: number = 1, limit: number = 8) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', page, limit],
    queryFn: async () => {
      const response = await api.get(`/jobs?page=${page}&limit=${limit}`);
      return response.data;
    },
    refetchInterval: (data) => {
      if (!data?.jobs) return 10000; // Poll every 10 seconds if no data

      const hasActiveJob = data.jobs.some((job: Job) =>
        job.jobStatus === 'processing' ||
        job.directorshipReportStatus === 'running'
      );

      return hasActiveJob ? 3000 : 10000; // Poll every 3 seconds if active, 10 seconds if not
    },
  });

  const jobs = data?.jobs || [];
  const pagination = data?.pagination;

  return {
    jobs,
    pagination,
    isLoading,
    error,
  };
}
