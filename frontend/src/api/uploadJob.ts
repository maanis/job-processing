import api from '@/services/api';
import { CreateJobResponse } from '@/types/job';
import { AxiosError } from 'axios';

export async function uploadJob(file: File): Promise<CreateJobResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post('/jobs/process', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Failed to upload job');
    }
}

export async function downloadOutputCsv(jobId: string): Promise<void> {
    const response = await api.get(`/jobs/${jobId}/download/csv`, {
        responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `output_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function downloadReportsZip(jobId: string): Promise<void> {
    const response = await api.get(`/jobs/${jobId}/download/zip`, {
        responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reports_${jobId}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}