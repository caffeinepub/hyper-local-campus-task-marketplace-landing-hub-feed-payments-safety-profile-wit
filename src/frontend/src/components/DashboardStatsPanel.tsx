import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSheetPostHistory,
  useSheetTaskHistory,
} from "@/hooks/useSheetStats";
import { type TaskRow, getTaskById } from "@/utils/sheetdb";
import { CheckCircle, FileText, Star, TrendingUp, X } from "lucide-react";
import { useState } from "react";

type ModalType = "completed" | "rating" | "earning" | "posted" | null;

interface DashboardStatsPanelProps {
  userId?: string;
}

export default function DashboardStatsPanel({
  userId,
}: DashboardStatsPanelProps) {
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [taskDetails, setTaskDetails] = useState<
    Record<string, TaskRow | null>
  >({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  const { data: taskHistory = [], isLoading: thLoading } =
    useSheetTaskHistory(userId);
  const { data: postHistory = [], isLoading: phLoading } =
    useSheetPostHistory(userId);

  const isLoading = thLoading || phLoading;

  const tasksCompleted = taskHistory.length;
  const ratingRows = taskHistory.filter(
    (r) => r.rating_score && !Number.isNaN(Number.parseFloat(r.rating_score)),
  );
  const avgRating =
    ratingRows.length > 0
      ? (
          ratingRows.reduce(
            (s, r) => s + Number.parseFloat(r.rating_score!),
            0,
          ) / ratingRows.length
        ).toFixed(1)
      : null;
  const totalEarning = taskHistory
    .filter(
      (r) =>
        r.amount_earned && !Number.isNaN(Number.parseFloat(r.amount_earned)),
    )
    .reduce((s, r) => s + Number.parseFloat(r.amount_earned!), 0);
  const tasksPosted = postHistory.length;

  const fetchDetailsFor = async (ids: string[]) => {
    if (ids.length === 0) return;
    setDetailsLoading(true);
    const results = await Promise.all(
      ids.map(
        async (id) => [id, await getTaskById(id)] as [string, TaskRow | null],
      ),
    );
    const map: Record<string, TaskRow | null> = {};
    for (const [id, row] of results) map[id] = row;
    setTaskDetails(map);
    setDetailsLoading(false);
  };

  const handleOpen = async (type: ModalType) => {
    setOpenModal(type);
    setTaskDetails({});
    if (type === "completed" || type === "rating" || type === "earning") {
      const ids = [
        ...new Set(taskHistory.map((r) => r.task_id).filter(Boolean)),
      ];
      await fetchDetailsFor(ids);
    } else if (type === "posted") {
      const ids = [
        ...new Set(postHistory.map((r) => r.task_id).filter(Boolean)),
      ];
      await fetchDetailsFor(ids);
    }
  };

  const statCards = [
    {
      key: "completed" as ModalType,
      label: "Tasks Completed",
      value: tasksCompleted.toString(),
      icon: CheckCircle,
      gradient: "from-[oklch(0.8_0.25_150)] to-[oklch(0.75_0.22_200)]",
      glow: "shadow-glow-green",
      border: "border-[oklch(0.8_0.25_150)]/40",
      ocid: "stats.tasks_completed.card",
    },
    {
      key: "rating" as ModalType,
      label: "User Rating",
      value: avgRating ? `${avgRating} ★` : "N/A",
      icon: Star,
      gradient: "from-[oklch(0.7_0.2_270)] to-[oklch(0.75_0.22_200)]",
      glow: "shadow-glow-purple",
      border: "border-[oklch(0.7_0.2_270)]/40",
      ocid: "stats.user_rating.card",
    },
    {
      key: "earning" as ModalType,
      label: "Total Earning",
      value: `₹${totalEarning.toFixed(0)}`,
      icon: TrendingUp,
      gradient: "from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)]",
      glow: "shadow-glow-teal",
      border: "border-[oklch(0.75_0.22_200)]/40",
      ocid: "stats.total_earning.card",
    },
    {
      key: "posted" as ModalType,
      label: "Tasks Posted",
      value: tasksPosted.toString(),
      icon: FileText,
      gradient: "from-[oklch(0.7_0.2_270)] to-[oklch(0.8_0.25_150)]",
      glow: "shadow-glow-green",
      border: "border-[oklch(0.8_0.25_150)]/30",
      ocid: "stats.tasks_posted.card",
    },
  ];

  const modalOcidMap: Record<string, string> = {
    completed: "stats.tasks_completed.modal",
    rating: "stats.user_rating.modal",
    earning: "stats.total_earning.modal",
    posted: "stats.tasks_posted.modal",
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {(["s0", "s1", "s2", "s3"] as const).map((k) => (
          <Skeleton key={k} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              data-ocid={card.ocid}
              onClick={() => handleOpen(card.key)}
              className={`relative overflow-hidden rounded-2xl backdrop-blur-xl bg-card/30 border ${card.border} p-4 flex flex-col gap-2 ${card.glow} text-left cursor-pointer hover:bg-card/50 transition-colors`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`}
              />
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4 text-black" />
                </div>
                <span className="text-xs font-medium text-muted-foreground leading-tight">
                  {card.label}
                </span>
              </div>
              <p
                className={`text-3xl font-black bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent leading-none`}
              >
                {card.value}
              </p>
            </button>
          );
        })}
      </div>

      <Dialog
        open={openModal !== null}
        onOpenChange={(o) => !o && setOpenModal(null)}
      >
        <DialogContent
          className="backdrop-blur-xl bg-card/90 border-border max-w-sm w-full max-h-[80vh] overflow-y-auto"
          data-ocid={openModal ? modalOcidMap[openModal] : undefined}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {openModal === "completed" && "Tasks Completed"}
              {openModal === "rating" && "User Ratings"}
              {openModal === "earning" && "Total Earning"}
              {openModal === "posted" && "Tasks Posted"}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div
              className="space-y-2 mt-2"
              data-ocid="stats.modal.loading_state"
            >
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {/* ── Tasks Completed (Performer View) ── */}
              {openModal === "completed" &&
                (taskHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No completed tasks yet.
                  </p>
                ) : (
                  taskHistory.map((row, i) => {
                    const task = taskDetails[row.task_id];
                    const completionDate = row.completion_date ?? "";
                    return (
                      <div
                        key={`c-${row.task_id}-${i}`}
                        className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 space-y-1"
                        data-ocid={`stats.tasks_completed.item.${i + 1}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {task?.task_name || row.task_id}
                          </p>
                          {/* Status tag — always Completed for task_history */}
                          <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[oklch(0.8_0.25_150)]/20 text-[oklch(0.8_0.25_150)] border border-[oklch(0.8_0.25_150)]/30">
                            Completed
                          </span>
                        </div>
                        {completionDate && (
                          <p className="text-xs text-muted-foreground">
                            {completionDate}
                          </p>
                        )}
                      </div>
                    );
                  })
                ))}

              {/* ── User Rating ── */}
              {openModal === "rating" &&
                (ratingRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No ratings yet.
                  </p>
                ) : (
                  ratingRows.map((row, i) => {
                    const task = taskDetails[row.task_id];
                    const score = Number.parseFloat(row.rating_score!);
                    return (
                      <div
                        key={`r-${row.task_id}-${i}`}
                        className="flex items-start justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 gap-2"
                        data-ocid={`stats.user_rating.item.${i + 1}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {task?.task_name || row.task_id}
                          </p>
                          {row.originator && (
                            <p className="text-xs text-muted-foreground">
                              by {row.originator}
                            </p>
                          )}
                        </div>
                        <span
                          className="text-sm font-bold shrink-0"
                          style={{ color: "oklch(0.8 0.25 70)" }}
                        >
                          {score} ★
                        </span>
                      </div>
                    );
                  })
                ))}

              {/* ── Total Earning ── */}
              {openModal === "earning" &&
                (taskHistory.filter((r) => r.amount_earned).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No earnings recorded yet.
                  </p>
                ) : (
                  taskHistory
                    .filter((r) => r.amount_earned)
                    .map((row, i) => {
                      const task = taskDetails[row.task_id];
                      return (
                        <div
                          key={`e-${row.task_id}-${i}`}
                          className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 gap-2"
                          data-ocid={`stats.total_earning.item.${i + 1}`}
                        >
                          <p className="text-sm font-medium truncate">
                            {task?.task_name || row.task_id}
                          </p>
                          <span
                            className="text-sm font-bold shrink-0"
                            style={{ color: "oklch(0.8 0.25 150)" }}
                          >
                            ₹{Number.parseFloat(row.amount_earned!).toFixed(0)}
                          </span>
                        </div>
                      );
                    })
                ))}

              {/* ── Tasks Posted (Originator View) ── */}
              {openModal === "posted" &&
                (postHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No posted tasks yet.
                  </p>
                ) : (
                  postHistory.map((row, i) => {
                    const task = taskDetails[row.task_id];
                    // status comes from the task sheet col H; fallback to post_history
                    const rawStatus = (task?.status ?? "").toLowerCase().trim();
                    const isCompleted = rawStatus === "completed";
                    // date: if completed show date_finished, otherwise date_posted
                    const displayDate = isCompleted
                      ? (row.date_finished ?? row.completion_date ?? "")
                      : (row.date_posted ?? "");

                    return (
                      <div
                        key={`p-${row.task_id}-${i}`}
                        className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 space-y-1"
                        data-ocid={`stats.tasks_posted.item.${i + 1}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {task?.task_name || row.task_name || row.task_id}
                          </p>
                          {isCompleted ? (
                            <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[oklch(0.8_0.25_150)]/20 text-[oklch(0.8_0.25_150)] border border-[oklch(0.8_0.25_150)]/30">
                              Completed
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[oklch(0.75_0.2_70)]/20 text-[oklch(0.75_0.2_70)] border border-[oklch(0.75_0.2_70)]/30">
                              Pending
                            </span>
                          )}
                        </div>
                        {displayDate && (
                          <p className="text-xs text-muted-foreground">
                            {isCompleted ? "Completed:" : "Posted:"}{" "}
                            {displayDate}
                          </p>
                        )}
                      </div>
                    );
                  })
                ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              data-ocid="stats.modal.close_button"
              onClick={() => setOpenModal(null)}
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
