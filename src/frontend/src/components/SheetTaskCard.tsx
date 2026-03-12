import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SheetTask } from "@/utils/sheetdb";
import { AtSign, CalendarDays, IndianRupee, MapPin } from "lucide-react";
import { useState } from "react";
import AuthPromptDialog from "./AuthPromptDialog";
import SheetTaskDetailsSheet from "./SheetTaskDetailsSheet";

interface SheetTaskCardProps {
  task: SheetTask;
  isAuthenticated?: boolean;
  onOpenChat?: (taskId: string, taskTitle: string, creatorId: string) => void;
}

export default function SheetTaskCard({
  task,
  isAuthenticated = false,
  onOpenChat,
}: SheetTaskCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  const handleCardClick = () => {
    if (!isAuthenticated) {
      setIsAuthPromptOpen(true);
      return;
    }
    setIsDetailsOpen(true);
  };

  const hasPhoto = !!task.task_photo;

  // Strip safe spot from location string if present (e.g. "ABC University | near A1 building")
  let locationText = task.location || "";
  if (locationText.includes("|")) {
    locationText = locationText.split("|")[0].trim();
  }

  return (
    <>
      <Card
        data-ocid="sheet_task_card.item"
        className="backdrop-blur-xl bg-card/30 border border-border/50 hover:border-[oklch(0.8_0.25_150)]/60 hover:shadow-glow-green transition-all duration-300 cursor-pointer overflow-hidden group"
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* Task Photo — compact thumbnail, object-contain to avoid cropping */}
          <div
            className="relative w-full overflow-hidden bg-[oklch(0.1_0.03_270)]"
            style={{ aspectRatio: "16/9", maxHeight: "140px" }}
          >
            {hasPhoto ? (
              <img
                src={task.task_photo}
                alt={task.task_name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[oklch(0.15_0.05_270)] to-[oklch(0.1_0.03_150)]">
                <span className="text-muted-foreground text-xs font-medium">
                  {task.category || "Task"}
                </span>
              </div>
            )}

            {/* Category Badge */}
            {task.category && (
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black border-none backdrop-blur-sm shadow-md font-semibold text-[10px] px-2 py-0.5">
                {task.category}
              </Badge>
            )}

            {/* Login hint for unauthenticated users */}
            {!isAuthenticated && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                <span className="text-white text-[10px] font-semibold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Login to view details
                </span>
              </div>
            )}
          </div>

          {/* Task Info — compact padding */}
          <div className="px-3 pt-2.5 pb-3 space-y-1.5">
            {/* Creator handle */}
            <div className="flex items-center gap-1">
              <AtSign className="w-3 h-3 text-[oklch(0.8_0.25_150)] flex-shrink-0" />
              <span className="text-[10px] font-semibold text-[oklch(0.8_0.25_150)] truncate">
                {task.user_id_originator}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-[oklch(0.8_0.25_150)] transition-colors">
              {task.task_name}
            </h3>

            {/* Location + Due Date */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0 text-[oklch(0.75_0.22_200)]" />
                <span className="truncate">{locationText}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3 h-3 flex-shrink-0 text-[oklch(0.7_0.2_270)]" />
                <span className="truncate">
                  {task.deadline ? `Due ${task.deadline}` : "No due date"}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-1 pt-1 border-t border-border/40">
              <IndianRupee className="w-4 h-4 text-[oklch(0.8_0.25_150)]" />
              <span className="text-base font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                {task.price}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAuthenticated && (
        <SheetTaskDetailsSheet
          task={task}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onOpenChat={onOpenChat}
        />
      )}

      <AuthPromptDialog
        open={isAuthPromptOpen}
        onOpenChange={setIsAuthPromptOpen}
        reason="view-task"
        onLoginSuccess={() => setIsDetailsOpen(true)}
      />
    </>
  );
}
