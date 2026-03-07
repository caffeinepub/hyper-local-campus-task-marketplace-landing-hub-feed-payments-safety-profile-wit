import { ExternalBlob, Stars, type Task } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCompleteTask, useVerifyTask } from "@/hooks/useTaskActions";
import { logPerformerHistory, logPosterHistory } from "@/utils/sheetdb";
import { Loader2, Star, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CompleteTaskModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompleteTaskModal({
  task,
  open,
  onOpenChange,
}: CompleteTaskModalProps) {
  const { identity } = useInternetIdentity();
  const completeMutation = useCompleteTask();
  const verifyMutation = useVerifyTask();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rating, setRating] = useState<Stars | null>(null);
  const [_isCompleted, setIsCompleted] = useState(false);

  const isCreator =
    identity?.getPrincipal().toString() === task.creator.toString();
  const isPerformer =
    task.performer &&
    identity?.getPrincipal().toString() === task.performer.toString();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async () => {
    if (!photoFile) {
      toast.error("Please upload a completion photo");
      return;
    }

    try {
      const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
      const photoBlob = ExternalBlob.fromBytes(photoBytes).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        },
      );

      await completeMutation.mutateAsync({
        taskId: task.id,
        photo: photoBlob,
      });

      toast.success("Task marked as complete! Awaiting verification.");
      setIsCompleted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete task");
    }
  };

  const handleVerify = async () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    if (!task.performer) {
      toast.error("No performer assigned");
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        taskId: task.id,
        rating,
        performer: task.performer,
      });

      toast.success("Task verified and rated!");
      onOpenChange(false);

      // Fire-and-forget: log to both history sheets
      const today = new Date().toLocaleDateString("en-IN");
      const taskIdStr = task.id.toString();
      const priceStr = task.price.toString();
      const performerStr = task.performer!.toString();
      const creatorStr = task.creator.toString();
      Promise.allSettled([
        logPerformerHistory(performerStr, taskIdStr, priceStr, today),
        logPosterHistory(creatorStr, taskIdStr, priceStr, performerStr),
      ]).catch(() => {}); // silent

      // Reset state
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadProgress(0);
      setRating(null);
      setIsCompleted(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to verify task");
    }
  };

  const ratingOptions: { value: Stars; label: string }[] = [
    { value: Stars.one, label: "1" },
    { value: Stars.two, label: "2" },
    { value: Stars.three, label: "3" },
    { value: Stars.four, label: "4" },
    { value: Stars.five, label: "5" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-card/95 border-border max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isCreator ? "Verify & Rate Task" : "Complete Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isPerformer && !task.isCompleted && (
            <>
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Upload Completion Photo *</Label>
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[oklch(0.8_0.25_150)]/50 transition-colors bg-muted/30">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {completeMutation.isPending && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending || !photoFile}
                className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold"
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Submit Completion"
                )}
              </Button>
            </>
          )}

          {isCreator && task.isCompleted && !task.isVerified && (
            <>
              {/* Show completion photo */}
              {task.verificationPhoto && (
                <div className="space-y-2">
                  <Label>Completion Photo</Label>
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={task.verificationPhoto.getDirectURL()}
                      alt="Completion"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="space-y-2">
                <Label>Rate the Performer *</Label>
                <div className="flex gap-2 justify-center py-4">
                  {ratingOptions.map(({ value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        rating === value
                          ? "bg-[oklch(0.8_0.25_150)] text-black scale-110"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <Star
                        className={`w-6 h-6 ${rating === value ? "fill-current" : ""}`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {rating
                    ? `${ratingOptions.find((r) => r.value === rating)?.label} star${rating !== Stars.one ? "s" : ""}`
                    : "Select a rating"}
                </p>
              </div>

              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !rating}
                className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Rate"
                )}
              </Button>
            </>
          )}

          {task.isVerified && (
            <div className="text-center py-8 text-muted-foreground">
              <p>This task has been verified and rated.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
