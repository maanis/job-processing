import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface FailedRow {
  id: string;
  jobId: string;
  refNo: string;
  candidateName: string;
  pan: string;
  errorMessage: string;
}

const dummyFailedRows: FailedRow[] = [
  { id: '1', jobId: 'JOB00001234', refNo: 'REF000042', candidateName: 'John Smith', pan: 'ABCDE1234F', errorMessage: 'Invalid PAN format' },
  { id: '2', jobId: 'JOB00001234', refNo: 'REF000078', candidateName: 'Jane Doe', pan: 'FGHIJ5678K', errorMessage: 'Duplicate entry found' },
  { id: '3', jobId: 'JOB00001235', refNo: 'REF000112', candidateName: 'Mike Johnson', pan: 'KLMNO9012L', errorMessage: 'Missing required field' },
  { id: '4', jobId: 'JOB00001235', refNo: 'REF000156', candidateName: 'Sarah Williams', pan: 'PQRST3456M', errorMessage: 'Invalid date format' },
  { id: '5', jobId: 'JOB00001236', refNo: 'REF000201', candidateName: 'David Brown', pan: 'UVWXY7890N', errorMessage: 'Record not found in database' },
  { id: '6', jobId: 'JOB00001236', refNo: 'REF000245', candidateName: 'Emily Davis', pan: 'ZABCD1234O', errorMessage: 'Validation failed: Age must be 18+' },
  { id: '7', jobId: 'JOB00001237', refNo: 'REF000289', candidateName: 'Chris Miller', pan: 'EFGHI5678P', errorMessage: 'Network timeout during processing' },
  { id: '8', jobId: 'JOB00001237', refNo: 'REF000334', candidateName: 'Lisa Wilson', pan: 'JKLMN9012Q', errorMessage: 'Invalid email format' },
];

const uniqueJobIds = [...new Set(dummyFailedRows.map(row => row.jobId))];

export default function FailedRows() {
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  const filteredRows = useMemo(() => {
    return dummyFailedRows.filter((row) => {
      const matchesSearch = search === "" ||
        row.refNo.toLowerCase().includes(search.toLowerCase()) ||
        row.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        row.pan.toLowerCase().includes(search.toLowerCase()) ||
        row.errorMessage.toLowerCase().includes(search.toLowerCase());
      
      const matchesJob = selectedJobId === "" || row.jobId === selectedJobId;
      
      return matchesSearch && matchesJob;
    });
  }, [search, selectedJobId]);

  return (
    <DashboardLayout title="Failed Rows">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Failed Rows</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View and search failed processing records
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ref No, Name, PAN, or Error..."
              className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
            />
          </div>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
          >
            <option value="">All Jobs</option>
            {uniqueJobIds.map((jobId) => (
              <option key={jobId} value={jobId}>{jobId}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ref No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Candidate Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    PAN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Error Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No failed rows found
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`transition-default hover:bg-secondary/30 ${
                        index % 2 === 0 ? "" : "bg-secondary/20"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-foreground">
                        {row.jobId}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-foreground">
                        {row.refNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {row.candidateName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-foreground">
                        {row.pan}
                      </td>
                      <td className="px-4 py-3 text-sm text-destructive">
                        {row.errorMessage}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
