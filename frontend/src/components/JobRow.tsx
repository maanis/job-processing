import { Eye, Download, FileArchive } from "lucide-react";
import { Job } from "@/hooks/useJobs";
import { useJobStatus } from "@/hooks/useJobStatus";
import { StatusBadge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { downloadOutputCsv, downloadReportsZip } from "@/api/uploadJob";

interface JobRowProps {
    job: Job;
    onViewDetails: (job: Job) => void;
    index: number;
}

/**
 * Correct stage detection based on backend workflow:
 * queued → processing → generating → completed
 */
function getStage(job: Job) {
    // 1️⃣ Failed always first
    if (job.jobStatus === "failed") {
        return { label: "Failed", phase: "failed" };
    }

    // 2️⃣ Still waiting in queue
    if (job.jobStatus === "queued") {
        return { label: "Queued", phase: "queued" };
    }

    // 3️⃣ Data processing phase
    if (
        job.jobStatus === "processing" &&
        job.directorshipStatus !== "completed"
    ) {
        return { label: "Processing", phase: "processing-data" };
    }

    // 4️⃣ Report generation phase
    if (
        job.directorshipStatus === "completed" &&
        job.directorshipReportStatus !== "completed"
    ) {
        return { label: "Generating", phase: "generating-reports" };
    }

    // 5️⃣ Fully completed
    return { label: "Completed", phase: "completed" };
}

export function JobRow({ job, onViewDetails, index }: JobRowProps) {
    const { data: updatedJob } = useJobStatus(job);

    const currentJob = updatedJob || job;
    const stage = getStage(currentJob);

    const handleDownloadCsv = async () => {
        try {
            await downloadOutputCsv(currentJob._id);
        } catch (error) {
            console.error("Failed to download CSV:", error);
        }
    };

    const handleDownloadZip = async () => {
        try {
            await downloadReportsZip(currentJob._id);
        } catch (error) {
            console.error("Failed to download ZIP:", error);
        }
    };

    return (
        <tr
            className={`transition-default hover:bg-secondary/30 ${index % 2 === 0 ? "" : "bg-secondary/20"
                }`}
        >
            {/* Job ID */}
            <td className="px-4 py-3 text-sm font-mono text-foreground">
                {currentJob._id.slice(-8)}
            </td>

            {/* Total */}
            <td className="px-4 py-3 text-sm text-foreground">
                {currentJob.totalRows ?? "-"}
            </td>

            {/* Success */}
            <td className="px-4 py-3 text-sm text-success">
                {currentJob.successRows ?? "-"}
            </td>

            {/* Failed */}
            <td className="px-4 py-3 text-sm text-destructive">
                {currentJob.failedRows ?? "-"}
            </td>

            {/* Status */}
            <td className="px-4 py-3">
                <StatusBadge status={stage.phase}>
                    {stage.label}
                </StatusBadge>
            </td>

            {/* Progress */}
            <td className="px-4 py-3 min-w-[80px]">
                {stage.phase === "queued" && (
                    <div className="text-xs text-muted-foreground">
                        Waiting in queue...
                    </div>
                )}

                {stage.phase === "processing-data" && (
                    <div>
                        <ProgressBar
                            progress={currentJob.processedRows}
                            total={currentJob.totalRows || 0}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {currentJob.processedRows}/{currentJob.totalRows} rows processed
                        </p>
                    </div>
                )}

                {stage.phase === "generating-reports" && (
                    <div>
                        <ProgressBar
                            progress={currentJob.reportsGenerated}
                            total={currentJob.successRows || 0}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {currentJob.reportsGenerated}/{currentJob.successRows} reports generated
                        </p>
                    </div>
                )}

                {stage.phase === "completed" && (
                    <div className="text-xs text-success font-medium">
                        {currentJob.reportsGenerated} reports generated
                    </div>
                )}

                {stage.phase === "failed" && (
                    <div className="text-xs text-destructive font-medium">
                        Processing failed
                    </div>
                )}
            </td>

            {/* Created */}
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {format(new Date(currentJob.createdAt), "MMM d, HH:mm")}
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onViewDetails(currentJob)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-default"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleDownloadCsv}
                                disabled={!currentJob.outputCsvPath}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-default"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Download Output</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleDownloadZip}
                                disabled={
                                    stage.phase !== "completed" ||
                                    !currentJob.reportZipPath
                                }
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-default"
                            >
                                <FileArchive className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Download Report ZIP</TooltipContent>
                    </Tooltip>
                </div>
            </td>
        </tr>
    );
}
