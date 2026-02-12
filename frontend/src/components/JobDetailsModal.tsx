import { Job } from "@/hooks/useJobs";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/Badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button"; // Assuming a Button component exists
import { downloadFailedRowsCsv } from "@/services/api";

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  if (!job) return null;

  const handleDownload = async () => {
    console.log('hshshsh')
    console.log(job)
    if (job && job._id) {
      try {
        console.log('shg')
        await downloadFailedRowsCsv(job._id);
      } catch (error) {
        console.error("Failed to download the failed rows CSV file.", error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Details" className="max-w-2xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Total Rows</div>
            <div className="text-2xl font-semibold text-foreground">{job.totalRows}</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Success</div>
            <div className="text-2xl font-semibold text-success">{job.successRows}</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Failed</div>
            <div className="text-2xl font-semibold text-destructive">{job.failedRows}</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Created</div>
            <div className="text-lg font-semibold text-foreground">
              {format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <StatusBadge status={job.jobStatus} />
        </div>

        {job.failedRows > 0 && job.failedRowsPath && (
          <div className="mt-4">
            <Button onClick={handleDownload} className="w-full bg-primary text-white hover:bg-primary-dark">
              Download Failed Rows
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
