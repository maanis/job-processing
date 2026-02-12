import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Job } from './useJobs';

export function useJobStatus(job: Job) {
    const isActive =
        job.jobStatus === 'processing' ||
        job.directorshipStatus === 'running' ||
        job.directorshipReportStatus === 'running';

    return useQuery({
        queryKey: ['job-status', job._id],
        queryFn: async () => {
            const response = await api.get(`/jobs/${job._id}/status`);
            // Merge the status data with the existing job data
            return {
                ...job,
                ...response.data.data
            } as Job;
        },
        enabled: isActive,
        refetchInterval: isActive ? 1000 : false,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
        throwOnError: false,
    });
}
