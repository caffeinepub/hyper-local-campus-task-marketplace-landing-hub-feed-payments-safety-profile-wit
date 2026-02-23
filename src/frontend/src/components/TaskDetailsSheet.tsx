import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CompleteTaskModal from './CompleteTaskModal';
import QRCodeDisplay from './QRCodeDisplay';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useAssignPerformer, useToggleTelegramDiscussion, useDeleteTask } from '@/hooks/useTaskActions';
import { buildTelegramLink, buildUPILink } from '@/utils/deepLinks';
import { formatDeadline } from '@/utils/time';
import type { Task } from '@/backend';
import { MapPin, IndianRupee, MessageCircle, CreditCard, MapPinned, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskDetailsSheetProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailsSheet({ task, open, onOpenChange }: TaskDetailsSheetProps) {
  const { identity } = useInternetIdentity();
  const assignMutation = useAssignPerformer();
  const toggleTelegramMutation = useToggleTelegramDiscussion();
  const deleteMutation = useDeleteTask();
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isCreator = identity?.getPrincipal().toString() === task.creator.toString();
  const isPerformer = task.performer && identity?.getPrincipal().toString() === task.performer.toString();
  const canAccept = !task.performer && !isCreator && !!identity;
  const canComplete = isPerformer && !task.isVerified;

  const formattedDeadline = formatDeadline(task.deadline);

  const handleDiscuss = () => {
    // Block action when chat is disabled, regardless of user role
    if (!task.telegramDiscussionEnabled) {
      toast.error('Chat is currently disabled for this task');
      return;
    }

    const telegramLink = buildTelegramLink(task.telegramHandle);
    window.open(telegramLink, '_blank');
  };

  const handleAccept = async () => {
    if (!identity) {
      toast.error('Please login to accept tasks');
      return;
    }

    try {
      await assignMutation.mutateAsync(task.id);
      
      // Open UPI payment link
      const upiLink = buildUPILink(task.price);
      window.location.href = upiLink;
      
      toast.success('Task accepted! Complete the payment to proceed.');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept task');
    }
  };

  const handleToggleTelegram = async (enabled: boolean) => {
    try {
      await toggleTelegramMutation.mutateAsync({ taskId: task.id, enabled });
      toast.success(enabled ? 'Chat enabled' : 'Chat disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update chat setting');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(task.id);
      toast.success('Post deleted');
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const showTelegramButton = task.telegramDiscussionEnabled || isCreator;
  const telegramButtonDisabled = !task.telegramDiscussionEnabled;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="backdrop-blur-xl bg-card/95 border-border overflow-y-auto w-full sm:max-w-lg">
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
                  <p className="text-sm text-muted-foreground">Safe Meeting Spot</p>
                  <p className="font-medium">{task.safeSpot}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium text-[oklch(0.8_0.25_150)] text-xl">₹{task.price.toString()}</p>
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
                    <p className="font-medium text-[oklch(0.8_0.25_150)]">Task Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {task.isVerified ? 'Verified and rated' : 'Awaiting verification'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section - Show for tasks that can be accepted */}
            {canAccept && (
              <QRCodeDisplay taskId={task.id} price={task.price} />
            )}

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {/* Telegram Discussion Section */}
              <div className="space-y-2">
                {showTelegramButton && (
                  <Button
                    onClick={handleDiscuss}
                    variant="outline"
                    disabled={telegramButtonDisabled}
                    className={`w-full backdrop-blur-xl bg-background/50 ${
                      telegramButtonDisabled 
                        ? 'opacity-50 text-muted-foreground cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    <MessageCircle className={`w-4 h-4 mr-2 ${telegramButtonDisabled ? 'opacity-50' : ''}`} />
                    Discuss on Telegram
                  </Button>
                )}

                {/* Creator-only toggle control */}
                {isCreator && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                    <Label htmlFor="telegram-toggle" className="text-sm cursor-pointer">
                      {task.telegramDiscussionEnabled ? 'Chat enabled' : 'Chat disabled'}
                    </Label>
                    <Switch
                      id="telegram-toggle"
                      checked={task.telegramDiscussionEnabled}
                      onCheckedChange={handleToggleTelegram}
                      disabled={toggleTelegramMutation.isPending}
                    />
                  </div>
                )}

                {/* Message for non-creators when chat is disabled */}
                {!isCreator && !task.telegramDiscussionEnabled && (
                  <div className="text-center text-sm text-muted-foreground p-3 rounded-xl bg-muted/50 border border-border">
                    Chat is currently disabled by the task poster for this task.
                  </div>
                )}
              </div>

              {canAccept && (
                <Button
                  onClick={handleAccept}
                  disabled={assignMutation.isPending}
                  className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {assignMutation.isPending ? 'Processing...' : 'Accept Task & Pay'}
                </Button>
              )}

              {canComplete && (
                <Button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}

              {task.performer && !canComplete && !isCreator && (
                <div className="text-center text-sm text-muted-foreground p-4 rounded-xl bg-muted/50">
                  This task has been claimed by another user
                </div>
              )}

              {/* Creator-only Delete Post button */}
              {isCreator && (
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Post
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CompleteTaskModal
        task={task}
        open={isCompleteModalOpen}
        onOpenChange={setIsCompleteModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="backdrop-blur-xl bg-card/95 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove it from the hub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
