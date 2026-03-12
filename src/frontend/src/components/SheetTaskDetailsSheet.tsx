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
  AtSign,
  Clock,
  CreditCard,
  IndianRupee,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface SheetTaskDetailsSheetProps {
  task: SheetTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat?: (taskId: string, taskTitle: string, creatorId: string) => void;
}

export default function SheetTaskDetailsSheet({
  task,
  open,
  onOpenChange,
  onOpenChat,
}: SheetTaskDetailsSheetProps) {
  const hasPhoto = !!task.task_photo;

  const handleDiscuss = () => {
    if (onOpenChat) {
      onOpenChat(task.task_id, task.task_name, task.user_id_originator);
      onOpenChange(false);
    } else {
      toast.info("Chat is not available right now");
    }
  };

  const handleAccept = () => {
    const price = Number.parseFloat(task.price || "0");
    if (price > 0) {
      const upiLink = `upi://pay?pn=PROXIIS&am=${price}&cu=INR`;
      window.location.href = upiLink;
      toast.success("Opening UPI payment...");
    } else {
      toast.error("Invalid price for this task");
    }
    onOpenChange(false);
  };

  return (
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
                  <p className="text-sm text-muted-foreground">Deadline</p>
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
              data-ocid="sheet_task.accept_button"
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Accept Task & Pay
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
