import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import React from "react";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Context message shown to the user explaining why login is needed */
  reason?: "view-task" | "post-task";
  /** Called after successful login so the parent can proceed */
  onLoginSuccess?: () => void;
}

export default function AuthPromptDialog({
  open,
  onOpenChange,
  reason = "view-task",
  onLoginSuccess,
}: AuthPromptDialogProps) {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
      onOpenChange(false);
      onLoginSuccess?.();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  const title =
    reason === "post-task"
      ? "Login to Post a Task"
      : "Login to View Task Details";

  const description =
    reason === "post-task"
      ? "Create an account or log in to post tasks, connect with your campus community, and start earning."
      : "Create an account or log in to view full task details, accept tasks, and interact with the community.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-card/95 border border-border/60 max-w-sm rounded-2xl">
        <DialogHeader className="items-center text-center gap-4 pt-2">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] shadow-glow-green mx-auto">
            <Sparkles className="w-8 h-8 text-black" />
          </div>

          <DialogTitle className="text-2xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
            {title}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2 pb-2">
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold rounded-full gap-2"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoggingIn ? "Logging in..." : "Login / Create Account"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingIn}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          New here? Your account is created automatically on first login.
        </p>
      </DialogContent>
    </Dialog>
  );
}
