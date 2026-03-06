import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import { Loader2, LogIn, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SiGoogle } from "react-icons/si";
import { toast } from "sonner";

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
  const { signIn: googleSignIn, isLoaded: googleLoaded } = useGoogleAuth();
  const {
    currentUser: sheetUser,
    loginWithGoogle,
    isLoading: sheetLoading,
  } = useSheetAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isLoggingIn = loginStatus === "logging-in";

  // Auto-close if already authenticated via SheetDB
  useEffect(() => {
    if (sheetUser && open) {
      onOpenChange(false);
      onLoginSuccess?.();
    }
  }, [sheetUser, open, onOpenChange, onLoginSuccess]);

  const handleIILogin = async () => {
    try {
      await login();
      onOpenChange(false);
      onLoginSuccess?.();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleLoaded) {
      toast.error("Google Sign-In is still loading. Please wait.");
      return;
    }
    setGoogleLoading(true);
    try {
      const email = await googleSignIn();
      if (!email) {
        setGoogleLoading(false);
        return;
      }
      const nameFromEmail = email.split("@")[0].replace(/[._]/g, " ");
      await loginWithGoogle(email, nameFromEmail);
      toast.success("Signed in with Google!");
      onOpenChange(false);
      onLoginSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailPassword = () => {
    setAuthModalOpen(true);
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
    <>
      <Dialog open={open && !authModalOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="backdrop-blur-xl bg-card/95 border border-border/60 max-w-sm rounded-2xl"
          data-ocid="auth.dialog"
        >
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
            {/* Google Sign-In */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={
                googleLoading || sheetLoading || isLoggingIn || !googleLoaded
              }
              className="w-full border-border/60 hover:border-[oklch(0.8_0.25_150)]/50 gap-2 font-semibold"
              data-ocid="auth.secondary_button"
            >
              {googleLoading || sheetLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SiGoogle className="w-5 h-5 text-[#4285F4]" />
              )}
              {googleLoading || sheetLoading
                ? "Signing in..."
                : "Sign in with Google"}
            </Button>

            {/* Email / Password */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleEmailPassword}
              disabled={googleLoading || sheetLoading || isLoggingIn}
              className="w-full border-border/60 hover:border-[oklch(0.7_0.2_270)]/50 gap-2 font-semibold"
              data-ocid="auth.secondary_button"
            >
              <Mail className="w-5 h-5" />
              Email / Password
            </Button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground uppercase tracking-widest">
                  or
                </span>
              </div>
            </div>

            {/* Internet Identity */}
            <Button
              size="lg"
              onClick={handleIILogin}
              disabled={isLoggingIn || googleLoading || sheetLoading}
              className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold rounded-full gap-2"
              data-ocid="auth.primary_button"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isLoggingIn ? "Logging in..." : "Login with Internet Identity"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoggingIn || googleLoading || sheetLoading}
              className="w-full text-muted-foreground hover:text-foreground"
              data-ocid="auth.cancel_button"
            >
              Maybe later
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-2">
            New here? Your account is created automatically on first login.
          </p>
        </DialogContent>
      </Dialog>

      {/* Email/Password modal opens on top */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={(isOpen) => {
          setAuthModalOpen(isOpen);
        }}
        defaultTab="signin"
        onSuccess={() => {
          setAuthModalOpen(false);
          onOpenChange(false);
          onLoginSuccess?.();
        }}
      />
    </>
  );
}
