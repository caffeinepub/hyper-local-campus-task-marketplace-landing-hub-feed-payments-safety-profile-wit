import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useState } from "react";
import { SiGoogle } from "react-icons/si";
import { toast } from "sonner";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onNeedsProfileCompletion?: () => void;
  defaultTab?: "signin" | "signup";
}

export default function AuthModal({
  open,
  onOpenChange,
  onSuccess,
  onNeedsProfileCompletion,
  defaultTab = "signin",
}: AuthModalProps) {
  const { signIn: googleSignIn, isLoaded: googleLoaded } = useGoogleAuth();
  const { loginWithGoogle, signUpWithEmail, loginWithEmail, isLoading } =
    useSheetAuth();

  // Sign-in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInShowPwd, setSignInShowPwd] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [signInGoogleLoading, setSignInGoogleLoading] = useState(false);

  // Sign-up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpShowPwd, setSignUpShowPwd] = useState(false);
  const [signUpShowConfirm, setSignUpShowConfirm] = useState(false);
  const [signUpError, setSignUpError] = useState("");
  const [signUpGoogleLoading, setSignUpGoogleLoading] = useState(false);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset all state
      setSignInEmail("");
      setSignInPassword("");
      setSignInError("");
      setSignUpName("");
      setSignUpEmail("");
      setSignUpPassword("");
      setSignUpConfirm("");
      setSignUpError("");
    }
    onOpenChange(isOpen);
  };

  // ── Google sign-in (both tabs use the same flow) ──────────────────────
  const handleGoogleSignIn = async (mode: "signin" | "signup") => {
    if (!googleLoaded) {
      toast.error("Google Sign-In is still loading. Please wait.");
      return;
    }
    const setGoogleLoading =
      mode === "signin" ? setSignInGoogleLoading : setSignUpGoogleLoading;
    const setError = mode === "signin" ? setSignInError : setSignUpError;

    setGoogleLoading(true);
    setError("");
    try {
      const email = await googleSignIn();
      if (!email) {
        setError("Google sign-in was cancelled or unavailable.");
        setGoogleLoading(false);
        return;
      }
      const nameFromEmail = email.split("@")[0].replace(/[._]/g, " ");
      const result = await loginWithGoogle(email, nameFromEmail);
      toast.success("Signed in with Google!");
      onOpenChange(false);
      if (!result.profile_complete) {
        onNeedsProfileCompletion?.();
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email login ───────────────────────────────────────────────────────
  const handleEmailSignIn = async () => {
    setSignInError("");
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setSignInError("Please enter your email and password.");
      return;
    }
    try {
      const result = await loginWithEmail(signInEmail.trim(), signInPassword);
      toast.success("Logged in successfully!");
      onOpenChange(false);
      if (!result.profile_complete) {
        onNeedsProfileCompletion?.();
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setSignInError(err?.message || "Login failed. Please try again.");
    }
  };

  // ── Email sign-up ─────────────────────────────────────────────────────
  const handleEmailSignUp = async () => {
    setSignUpError("");
    if (
      !signUpName.trim() ||
      !signUpEmail.trim() ||
      !signUpPassword ||
      !signUpConfirm
    ) {
      setSignUpError("Please fill in all fields.");
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setSignUpError("Passwords do not match.");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters.");
      return;
    }
    try {
      const result = await signUpWithEmail(
        signUpName.trim(),
        signUpEmail.trim(),
        signUpPassword,
      );
      toast.success("Account created! Welcome to PROXIIS 🎉");
      onOpenChange(false);
      if (!result.profile_complete) {
        onNeedsProfileCompletion?.();
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setSignUpError(err?.message || "Sign-up failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="backdrop-blur-xl bg-card/95 border border-[oklch(0.8_0.25_150)]/30 max-w-sm rounded-2xl p-0 overflow-hidden"
        data-ocid="auth.modal"
      >
        {/* Gradient header strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)]" />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-center bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
              PROXIIS
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full mb-5 bg-muted/60 rounded-xl h-10">
              <TabsTrigger
                value="signin"
                className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[oklch(0.8_0.25_150)] data-[state=active]:to-[oklch(0.7_0.2_270)] data-[state=active]:text-black font-semibold"
                data-ocid="auth.tab"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[oklch(0.8_0.25_150)] data-[state=active]:to-[oklch(0.7_0.2_270)] data-[state=active]:text-black font-semibold"
                data-ocid="auth.tab"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* ── SIGN IN TAB ─────────────────────────────────────────── */}
            <TabsContent value="signin" className="space-y-4 mt-0">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-border/60 hover:border-[oklch(0.8_0.25_150)]/50 gap-2 font-semibold"
                onClick={() => handleGoogleSignIn("signin")}
                disabled={signInGoogleLoading || isLoading || !googleLoaded}
                data-ocid="auth.primary_button"
              >
                {signInGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SiGoogle className="w-4 h-4 text-[#4285F4]" />
                )}
                {signInGoogleLoading ? "Signing in..." : "Sign in with Google"}
              </Button>

              <Divider label="or" />

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="si-email"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="si-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    disabled={isLoading || signInGoogleLoading}
                    className="bg-background/60 pl-9"
                    autoComplete="email"
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
                    data-ocid="auth.input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="si-password"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="si-password"
                    type={signInShowPwd ? "text" : "password"}
                    placeholder="Your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    disabled={isLoading || signInGoogleLoading}
                    className="bg-background/60 pl-9 pr-10"
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
                    data-ocid="auth.input"
                  />
                  <button
                    type="button"
                    onClick={() => setSignInShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      signInShowPwd ? "Hide password" : "Show password"
                    }
                  >
                    {signInShowPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {signInError && (
                <ErrorMessage message={signInError} id="auth.error_state" />
              )}

              <Button
                onClick={handleEmailSignIn}
                disabled={isLoading || signInGoogleLoading}
                className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-bold py-5 rounded-xl"
                data-ocid="auth.submit_button"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </TabsContent>

            {/* ── SIGN UP TAB ─────────────────────────────────────────── */}
            <TabsContent value="signup" className="space-y-3 mt-0">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-border/60 hover:border-[oklch(0.8_0.25_150)]/50 gap-2 font-semibold"
                onClick={() => handleGoogleSignIn("signup")}
                disabled={signUpGoogleLoading || isLoading || !googleLoaded}
                data-ocid="auth.secondary_button"
              >
                {signUpGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SiGoogle className="w-4 h-4 text-[#4285F4]" />
                )}
                {signUpGoogleLoading ? "Signing up..." : "Sign up with Google"}
              </Button>

              <Divider label="or" />

              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="su-name"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-name"
                    type="text"
                    placeholder="Your full name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    disabled={isLoading || signUpGoogleLoading}
                    className="bg-background/60 pl-9"
                    autoComplete="name"
                    data-ocid="auth.input"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="su-email"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    disabled={isLoading || signUpGoogleLoading}
                    className="bg-background/60 pl-9"
                    autoComplete="email"
                    data-ocid="auth.input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="su-password"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-password"
                    type={signUpShowPwd ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    disabled={isLoading || signUpGoogleLoading}
                    className="bg-background/60 pl-9 pr-10"
                    autoComplete="new-password"
                    data-ocid="auth.input"
                  />
                  <button
                    type="button"
                    onClick={() => setSignUpShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      signUpShowPwd ? "Hide password" : "Show password"
                    }
                  >
                    {signUpShowPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="su-confirm"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-confirm"
                    type={signUpShowConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={signUpConfirm}
                    onChange={(e) => setSignUpConfirm(e.target.value)}
                    disabled={isLoading || signUpGoogleLoading}
                    className="bg-background/60 pl-9 pr-10"
                    autoComplete="new-password"
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSignUp()}
                    data-ocid="auth.input"
                  />
                  <button
                    type="button"
                    onClick={() => setSignUpShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      signUpShowConfirm ? "Hide password" : "Show password"
                    }
                  >
                    {signUpShowConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {signUpError && (
                <ErrorMessage message={signUpError} id="auth.error_state" />
              )}

              <Button
                onClick={handleEmailSignUp}
                disabled={isLoading || signUpGoogleLoading}
                className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-bold py-5 rounded-xl"
                data-ocid="auth.submit_button"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/40" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-3 text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      </div>
    </div>
  );
}

function ErrorMessage({ message, id }: { message: string; id: string }) {
  return (
    <div
      className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg"
      data-ocid={id}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
