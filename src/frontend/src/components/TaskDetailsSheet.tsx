import type { Task } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useDeleteTask,
  useToggleTelegramDiscussion,
} from "@/hooks/useTaskActions";
import {
  deletePostHistoryByTaskId,
  deleteTaskFromSheet,
  deleteTaskHistoryByTaskId,
} from "@/utils/sheetdb";
import { formatDeadline } from "@/utils/time";
import {
  CheckCircle,
  Clock,
  IndianRupee,
  MapPin,
  MapPinned,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CompleteTaskModal from "./CompleteTaskModal";
import QRCodeDisplay from "./QRCodeDisplay";

interface TaskDetailsSheetProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat?: (taskId: bigint, taskTitle: string, creatorId: string) => void;
  /** Optional: called after successful delete so parent can refresh stats */
  onDeleted?: (sheetTaskId?: string) => void;
}

export default function TaskDetailsSheet({
  task,
  open,
  onOpenChange,
  onOpenChat,
  onDeleted,
}: TaskDetailsSheetProps) {
  const { identity } = useInternetIdentity();
  const toggleTelegramMutation = useToggleTelegramDiscussion();
  const deleteMutation = useDeleteTask();
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isCreator =
    identity?.getPrincipal().toString() === task.creator.toString();
  const isPerformer =
    task.performer &&
    identity?.getPrincipal().toString() === task.performer.toString();
  const canComplete = isPerformer && !task.isVerified;

  const formattedDeadline = formatDeadline(task.deadline);

  const handleDiscuss = () => {
    if (!task.telegramDiscussionEnabled) {
      toast.error("Chat is currently disabled for this task");
      return;
    }
    if (onOpenChat) {
      onOpenChat(task.id, task.title, task.creator.toString());
      onOpenChange(false);
    } else {
      toast.info("Chat is not available right now");
    }
  };

  const handleToggleTelegram = async (enabled: boolean) => {
    try {
      await toggleTelegramMutation.mutateAsync({ taskId: task.id, enabled });
      toast.success(enabled ? "Chat enabled" : "Chat disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to update chat setting");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const sheetTaskId = task.id.toString();

      await deleteMutation.mutateAsync(task.id);

      await Promise.allSettled([
        deleteTaskFromSheet(sheetTaskId),
        deletePostHistoryByTaskId(sheetTaskId),
        deleteTaskHistoryByTaskId(sheetTaskId),
      ]);

      toast.success("Post removed from the feed");
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      onDeleted?.(sheetTaskId);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove post");
    }
  };

  const showTelegramButton = task.telegramDiscussionEnabled || isCreator;
  const telegramButtonDisabled = !task.telegramDiscussionEnabled;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="backdrop-blur-xl bg-card/95 border-border overflow-y-auto w-full sm:max-w-lg"
          data-ocid="task.details.sheet"
        >
          <SheetHeader>
            <SheetTitle className="text-left">{task.title}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Task Photo */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
              <img
                src={task.taskPhoto.getDirectURL()}
                alt={task.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Category Badge */}
            <Badge className="bg-[oklch(0.8_0.25_150)]/20 text-[oklch(0.8_0.25_150)] border-[oklch(0.8_0.25_150)]/30">
              {task.category}
            </Badge>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{task.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPinned className="w-5 h-5 text-[oklch(0.8_0.25_150)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Safe Meeting Spot
                  </p>
                  <p className="font-medium">{task.safeSpot}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium text-[oklch(0.8_0.25_150)] text-xl">
                    ₹{task.price.toString()}
                  </p>
                </div>
              </div>

              {formattedDeadline && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">{formattedDeadline}</p>
                  </div>
                </div>
              )}

              {task.isCompleted && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[oklch(0.8_0.25_150)]/10 border border-[oklch(0.8_0.25_150)]/30">
                  <CheckCircle className="w-5 h-5 text-[oklch(0.8_0.25_150)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[oklch(0.8_0.25_150)]">
                      Task Completed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {task.isVerified
                        ? "Verified and rated"
                        : "Awaiting verification"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <div className="space-y-2">
                {showTelegramButton && (
                  <Button
                    data-ocid="task.discuss_chat_button"
                    onClick={handleDiscuss}
                    variant="outline"
                    disabled={telegramButtonDisabled}
                    className={`w-full backdrop-blur-xl bg-background/50 ${
                      telegramButtonDisabled
                        ? "opacity-50 text-muted-foreground cursor-not-allowed"
                        : "hover:bg-[oklch(0.8_0.25_150)]/10 hover:border-[oklch(0.8_0.25_150)]/60"
                    }`}
                  >
                    <MessageSquare
                      className={`w-4 h-4 mr-2 ${telegramButtonDisabled ? "opacity-50" : "text-[oklch(0.8_0.25_150)]"}`}
                    />
                    Discuss on Chat
                  </Button>
                )}

                {isCreator && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                    <Label
                      htmlFor="telegram-toggle"
                      className="text-sm cursor-pointer"
                    >
                      {task.telegramDiscussionEnabled
                        ? "Chat enabled"
                        : "Chat disabled"}
                    </Label>
                    <Switch
                      id="telegram-toggle"
                      checked={task.telegramDiscussionEnabled}
                      onCheckedChange={handleToggleTelegram}
                      disabled={toggleTelegramMutation.isPending}
                    />
                  </div>
                )}

                {!isCreator && !task.telegramDiscussionEnabled && (
                  <div className="text-center text-sm text-muted-foreground p-3 rounded-xl bg-muted/50 border border-border">
                    Chat is currently disabled by the task poster for this task.
                  </div>
                )}
              </div>

              {canComplete && (
                <Button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold"
                  data-ocid="task.complete_button"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}

              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
                className="w-full"
                data-ocid="task.remove_post_button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Post
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CompleteTaskModal
        task={task}
        open={isCompleteModalOpen}
        onOpenChange={setIsCompleteModalOpen}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent
          className="backdrop-blur-xl bg-card/95 border-border"
          data-ocid="task.remove.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post from everyone's feed and
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              data-ocid="task.remove.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="task.remove.confirm_button"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
