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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SheetTask } from "@/utils/sheetdb";
import {
  deletePostHistoryByTaskId,
  deleteTaskFromSheet,
  deleteTaskHistoryByTaskId,
} from "@/utils/sheetdb";
import {
  AtSign,
  Clock,
  IndianRupee,
  MapPin,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SheetTaskDetailsSheetProps {
  task: SheetTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat?: (taskId: string, taskTitle: string, creatorId: string) => void;
  onDeleted?: (taskId: string) => void;
}

export default function SheetTaskDetailsSheet({
  task,
  open,
  onOpenChange,
  onOpenChat,
  onDeleted,
}: SheetTaskDetailsSheetProps) {
  const hasPhoto = !!task.task_photo;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDiscuss = () => {
    if (onOpenChat) {
      onOpenChat(task.task_id, task.task_name, task.user_id_originator);
      onOpenChange(false);
    } else {
      toast.info("Chat is not available right now");
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await Promise.allSettled([
        deleteTaskFromSheet(task.task_id),
        deletePostHistoryByTaskId(task.task_id),
        deleteTaskHistoryByTaskId(task.task_id),
      ]);
      toast.success("Post removed from the feed");
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      onDeleted?.(task.task_id);
    } catch {
      toast.error("Failed to remove post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="backdrop-blur-xl bg-card/95 border-border overflow-y-auto w-full sm:max-w-lg"
          data-ocid="sheet_task.details.sheet"
        >
          <SheetHeader>
            <SheetTitle className="text-left">{task.task_name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Task Photo */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
              {hasPhoto ? (
                <img
                  src={task.task_photo}
                  alt={task.task_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[oklch(0.15_0.05_270)] to-[oklch(0.1_0.03_150)]">
                  <span className="text-muted-foreground text-sm">
                    {task.category || "Task"}
                  </span>
                </div>
              )}
            </div>

            {/* Category Badge */}
            {task.category && (
              <Badge className="bg-[oklch(0.8_0.25_150)]/20 text-[oklch(0.8_0.25_150)] border-[oklch(0.8_0.25_150)]/30">
                {task.category}
              </Badge>
            )}

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AtSign className="w-5 h-5 text-[oklch(0.8_0.25_150)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Posted by</p>
                  <p className="font-medium text-[oklch(0.8_0.25_150)]">
                    @{task.user_id_originator}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{task.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium text-[oklch(0.8_0.25_150)] text-xl">
                    ₹{task.price}
                  </p>
                </div>
              </div>

              {task.deadline && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last date to complete
                    </p>
                    <p className="font-medium">{task.deadline}</p>
                  </div>
                </div>
              )}

              {task.description && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed">{task.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button
                data-ocid="sheet_task.discuss_chat_button"
                onClick={handleDiscuss}
                variant="outline"
                disabled={!onOpenChat}
                className={`w-full backdrop-blur-xl bg-background/50 ${
                  !onOpenChat
                    ? "opacity-50 text-muted-foreground cursor-not-allowed"
                    : "hover:bg-[oklch(0.8_0.25_150)]/10 hover:border-[oklch(0.8_0.25_150)]/60"
                }`}
              >
                <MessageSquare
                  className={`w-4 h-4 mr-2 ${!onOpenChat ? "opacity-50" : "text-[oklch(0.8_0.25_150)]"}`}
                />
                {onOpenChat ? "Discuss on Chat" : "Chat not available"}
              </Button>

              <Button
                data-ocid="sheet_task.remove_post_button"
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Post
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent
          className="backdrop-blur-xl bg-card/95 border-border"
          data-ocid="sheet_task.remove.dialog"
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
              disabled={isDeleting}
              data-ocid="sheet_task.remove.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="sheet_task.remove.confirm_button"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
