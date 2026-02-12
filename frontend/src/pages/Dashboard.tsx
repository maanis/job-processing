import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobsTable } from "@/components/JobsTable";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { UploadJobModal } from "@/components/UploadJobModal";
import { useJobs, Job } from "@/hooks/useJobs";
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { jobs, pagination, isLoading, refetch } = useJobs(currentPage, 8);
  const [isRefetching, setIsRefetching] = useState(false);
  const queryClient = useQueryClient();

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRevalidate = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  return (
    <DashboardLayout title="Jobs Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Processing Jobs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload CSV files and track processing progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRevalidate} variant="outline" disabled={isRefetching}>
              {isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Revalidate Jobs
            </Button>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              Upload CSV
            </Button>
          </div>
        </div>

        <JobsTable jobs={jobs} onViewDetails={handleViewDetails} />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {jobs.length} of {pagination.totalJobs} jobs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev || isLoading}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-default"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={isLoading}
                    className={`px-3 py-2 text-sm rounded-lg border transition-default ${page === currentPage
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext || isLoading}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-default"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <JobDetailsModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />

        <UploadJobModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
