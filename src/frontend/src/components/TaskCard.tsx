import type { Task } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDeadline } from "@/utils/time";
import { AtSign, Clock, IndianRupee, MapPin } from "lucide-react";
import { useState } from "react";
import AuthPromptDialog from "./AuthPromptDialog";
import TaskDetailsSheet from "./TaskDetailsSheet";

interface TaskCardProps {
  task: Task;
  isAuthenticated?: boolean;
  onOpenChat?: (taskId: bigint, taskTitle: string, creatorId: string) => void;
}

/** Returns a short display handle for the task creator. */
function getCreatorHandle(task: Task): string {
  if (task.telegramHandle?.trim()) {
    const handle = task.telegramHandle.trim();
    return handle.startsWith("@") ? handle : `@${handle}`;
  }
  // Fall back to a shortened principal
  const principal = task.creator.toString();
  return `@${principal.slice(0, 5)}…${principal.slice(-3)}`;
}

export default function TaskCard({
  task,
  isAuthenticated = false,
  onOpenChat,
}: TaskCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const formattedDeadline = formatDeadline(task.deadline);

  const handleCardClick = () => {
    if (!isAuthenticated) {
      setIsAuthPromptOpen(true);
      return;
    }
    setIsDetailsOpen(true);
  };

  const handleLoginSuccess = () => {
    // After login, open the details sheet
    setIsDetailsOpen(true);
  };

  return (
    <>
      <Card
        className="backdrop-blur-xl bg-card/30 border border-border/50 hover:border-[oklch(0.8_0.25_150)]/60 hover:shadow-glow-green transition-all duration-300 cursor-pointer overflow-hidden group"
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* Task Photo */}
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={task.taskPhoto.getDirectURL()}
              alt={task.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            {/* Category Badge */}
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black border-none backdrop-blur-sm shadow-lg font-semibold px-3 py-1">
              {task.category}
            </Badge>

            {/* Lock overlay hint for unauthenticated users */}
            {!isAuthenticated && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                  Login to view details
                </span>
              </div>
            )}
          </div>

          {/* Task Info */}
          <div className="p-5 space-y-4">
            {/* Creator handle */}
            <div className="flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-[oklch(0.8_0.25_150)] flex-shrink-0" />
              <span className="text-xs font-semibold text-[oklch(0.8_0.25_150)] truncate">
                {getCreatorHandle(task)}
              </span>
            </div>

            <h3 className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-[oklch(0.8_0.25_150)] transition-colors">
              {task.title}
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[oklch(0.75_0.22_200)]" />
                <span className="truncate">{task.location}</span>
              </div>

              {formattedDeadline && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 flex-shrink-0 text-[oklch(0.7_0.2_270)]" />
                  <span className="truncate">{formattedDeadline}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <IndianRupee className="w-6 h-6 text-[oklch(0.8_0.25_150)]" />
              <span className="text-2xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                {task.price.toString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task details — only rendered for authenticated users */}
      {isAuthenticated && (
        <TaskDetailsSheet
          task={task}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Auth prompt for unauthenticated users */}
      <AuthPromptDialog
        open={isAuthPromptOpen}
        onOpenChange={setIsAuthPromptOpen}
        reason="view-task"
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
