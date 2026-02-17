import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  downloadAdminProcessedRows,
  downloadAdminFailedRows,
} from "@/services/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { format, subDays, isAfter, startOfDay } from "date-fns";
import { toast } from "sonner";

// Icons
import {
  Calendar as CalendarIcon,
  FileCheck,
  FileX,
  Loader2,
  ShieldCheck,
  ChevronRight,
  X,
} from "lucide-react";

// Shadcn UI Components (Assuming you have these or similar)
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // State for Date Range
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const [loadingProcessed, setLoadingProcessed] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);

  // useEffect(() => {
  //     const stored = localStorage.getItem('user');
  //     const user = stored ? JSON.parse(stored) : null;
  //     if (!user || user.role !== 'admin') {
  //         navigate('/dashboard');
  //     }
  // }, [navigate]);

  // --- Helper Functions ---

  const handlePresetClick = (days: number) => {
    const today = new Date();
    if (days === 0) {
      // Today
      setDate({ from: today, to: today });
    } else {
      // Last X days
      setDate({ from: subDays(today, days), to: today });
    }
  };

  const formatDateForApi = (d: Date | undefined) => {
    if (!d) return "";
    return format(d, "yyyy-MM-dd");
  };

  const handleDownload = async (type: "processed" | "failed") => {
    if (!date?.from || !date?.to) {
      toast.error("Please select a date range");
      return;
    }

    const fromStr = formatDateForApi(date.from);
    const toStr = formatDateForApi(date.to);

    // Auto-swap if user selected backwards
    const finalFrom = isAfter(date.from, date.to) ? toStr : fromStr;
    const finalTo = isAfter(date.from, date.to) ? fromStr : toStr;

    const typeLabel = type === "processed" ? "Processed Rows" : "Failed Rows";

    try {
      if (type === "processed") {
        setLoadingProcessed(true);
        await downloadAdminProcessedRows(finalFrom, finalTo);
        toast.success(`${typeLabel} downloaded successfully`);
      } else {
        setLoadingFailed(true);
        await downloadAdminFailedRows(finalFrom, finalTo);
        toast.success(`${typeLabel} downloaded successfully`);
      }
    } catch (err: any) {
      console.error(err);

      if (err.message === "NO_DATA") {
        toast.info(
          `No ${typeLabel.toLowerCase()} found for the selected date range`,
        );
      } else {
        const errorMsg =
          err.response?.status === 404
            ? `No ${typeLabel.toLowerCase()} found for the selected date range`
            : err.response?.data?.error ||
              `Failed to download ${typeLabel.toLowerCase()}`;
        toast.error(errorMsg);
      }
    } finally {
      setLoadingProcessed(false);
      setLoadingFailed(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <div className="hidden md:block w-72 shrink-0">
        <Sidebar />
      </div>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md px-8 py-4 z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Admin Console</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold tracking-tight">
                System Exports
              </h2>
              <p className="text-muted-foreground">
                Download logs and processed data reports.
              </p>
            </div>

            {/* Info Alert */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-600 dark:text-blue-400">
              <div className="flex gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Data Availability</p>
                  <p className="text-xs mt-1 text-blue-600/80 dark:text-blue-400/80">
                    Reports are generated after jobs complete processing. If the
                    download contains only headers, no data exists for the
                    selected date range.
                  </p>
                </div>
              </div>
            </div>

            {/* MAIN CARD */}
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-visible">
              <div className="p-8 space-y-8">
                {/* --- 1. Date Picker Section --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Select Date Range
                    </label>

                    {/* Reset Button (shows only if date selected) */}
                    {date?.from && (
                      <button
                        onClick={() =>
                          setDate({ from: undefined, to: undefined })
                        }
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal border-input bg-background/50 hover:bg-background/80 text-base",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {date?.from ? (
                            date.to ? (
                              <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(date.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={date?.from}
                          selected={date}
                          onSelect={setDate}
                          numberOfMonths={2}
                          disabled={(date) => isAfter(date, new Date())} // DISABLE FUTURE DATES
                          className="rounded-md border bg-popover text-popover-foreground"
                        />
                      </PopoverContent>
                    </Popover>

                    {/* --- CHIPS --- */}
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        label="Today"
                        onClick={() => handlePresetClick(0)}
                        active={false}
                      />
                      <Chip
                        label="Last 7 Days"
                        onClick={() => handlePresetClick(7)}
                        active={false}
                      />
                      <Chip
                        label="Last 30 Days"
                        onClick={() => handlePresetClick(30)}
                        active={false}
                      />
                      <Chip
                        label="Last 3 Months"
                        onClick={() => handlePresetClick(90)}
                        active={false}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* --- 2. Action Buttons --- */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ActionButton
                    label="Processed Data"
                    subLabel="Successful entries"
                    icon={FileCheck}
                    loading={loadingProcessed}
                    disabled={loadingFailed || !date?.from}
                    onClick={() => handleDownload("processed")}
                    variant="primary"
                  />
                  <ActionButton
                    label="Failed Rows"
                    subLabel="Error logs"
                    icon={FileX}
                    loading={loadingFailed}
                    disabled={loadingProcessed || !date?.from}
                    onClick={() => handleDownload("failed")}
                    variant="destructive"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Sub-Components for Clean Code ---

function Chip({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-all hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ActionButton({
  label,
  subLabel,
  icon: Icon,
  loading,
  disabled,
  onClick,
  variant,
}: any) {
  const isDestructive = variant === "destructive";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/30 p-6 text-center transition-all duration-200",
        // Hover States
        !disabled &&
          !isDestructive &&
          "hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]",
        !disabled &&
          isDestructive &&
          "hover:border-red-500/50 hover:bg-red-500/5 hover:shadow-lg hover:shadow-red-500/5 active:scale-[0.98]",
        // Active Loading State
        loading && !isDestructive && "border-primary/50 bg-primary/5",
        loading && isDestructive && "border-red-500/50 bg-red-500/5",
        // Disabled State
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110",
          isDestructive
            ? "bg-red-500/10 text-red-500"
            : "bg-primary/10 text-primary",
          loading && "animate-pulse",
        )}
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Icon className="h-6 w-6" />
        )}
      </div>
      <div>
        <span className="block font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{subLabel}</span>
      </div>
    </button>
  );
}
