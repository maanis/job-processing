import { Job } from "@/hooks/useJobs";
import { JobRow } from "@/components/JobRow";

interface JobsTableProps {
  jobs: Job[];
  onViewDetails: (job: Job) => void;
}

export function JobsTable({ jobs, onViewDetails }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center card-shadow">
        <p className="text-muted-foreground">
          No jobs yet. Upload a CSV file to get started.
        </p>
      </div>
    );
  }

  console.log(jobs)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Job ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Success
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Failed
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Progress
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {jobs.map((job, index) => (
              <JobRow
                key={job._id}
                job={job}
                onViewDetails={onViewDetails}
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
