import AuthModal from "@/components/AuthModal";
import DashboardStatsPanel from "@/components/DashboardStatsPanel";
import StarRating from "@/components/StarRating";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCreateUserProfileWithGoogle,
  useGetCallerProfile,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "@/hooks/useProfile";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import { useUserPostHistory } from "@/hooks/useTasks";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  Send,
  Trophy,
  User,
  UserCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiGoogle } from "react-icons/si";
import { toast } from "sonner";
import type { View } from "../App";

interface ProfileViewProps {
  onNavigate: (view: View) => void;
}

type OnboardingStep = "login" | "setup" | "dashboard";

export default function ProfileView({ onNavigate }: ProfileViewProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerProfile();
  const {
    data: userProfile,
    isLoading: userProfileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const createProfileWithGoogle = useCreateUserProfileWithGoogle();
  const saveProfile = useSaveCallerUserProfile();
  const {
    signIn,
    user: googleUser,
    error: googleError,
    isLoaded: googleLoaded,
  } = useGoogleAuth();

  // SheetDB auth
  const {
    currentUser: sheetUser,
    loginWithGoogle,
    logout: sheetLogout,
  } = useSheetAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">(
    "signin",
  );

  const [profileName, setProfileName] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [telegramError, setTelegramError] = useState("");
  const [manualGmail, setManualGmail] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal() || null;
  const principalStr = identity?.getPrincipal().toString() ?? "";

  // Fetch user's post history
  const { data: postHistory, isLoading: postHistoryLoading } =
    useUserPostHistory(userPrincipal);

  const averageRating =
    profile && profile.ratingCount > 0n
      ? Number(profile.ratingSum) / Number(profile.ratingCount)
      : 0;

  // Determine which onboarding step to show
  const getStep = (): OnboardingStep => {
    // SheetDB session takes priority
    if (sheetUser) return "dashboard";
    if (!isAuthenticated) return "login";
    if (userProfileLoading || !isFetched) return "login";
    if (userProfile === null) return "setup";
    return "dashboard";
  };

  const step = getStep();

  // Read stored telegram handle for dashboard
  const storedTelegram = identity
    ? localStorage.getItem(`proxiis_telegram_${principalStr}`) || ""
    : "";

  // Pre-fill name from Google user if available
  useEffect(() => {
    if (googleUser && !profileName) {
      setProfileName(googleUser.name || "");
    }
  }, [googleUser, profileName]);

  // Show Google error
  useEffect(() => {
    if (googleError) {
      setIsSigningInWithGoogle(false);
      toast.error(googleError);
    }
  }, [googleError]);

  const validateTelegram = (value: string): string => {
    if (!value.trim()) return "";
    if (!value.startsWith("@")) return "Telegram handle must start with @";
    if (value.length < 2) return "Please enter a valid Telegram handle";
    return "";
  };

  const handleTelegramChange = (value: string) => {
    setTelegramHandle(value);
    setTelegramError(validateTelegram(value));
  };

  const handleGoogleSignIn = async () => {
    if (!googleLoaded) {
      toast.error("Google Sign-In is still loading. Please wait a moment.");
      return;
    }
    setIsSigningInWithGoogle(true);
    try {
      const email = await signIn();
      if (email) {
        toast.success("Successfully signed in with Google!");
      } else {
        setIsSigningInWithGoogle(false);
      }
    } catch (_error: any) {
      toast.error("Failed to sign in with Google. Please try again.");
      setIsSigningInWithGoogle(false);
    }
  };

  // Google sign-in that also saves to SheetDB
  const handleSheetGoogleSignIn = async () => {
    if (!googleLoaded) {
      toast.error("Google Sign-In is still loading. Please wait.");
      return;
    }
    setIsSigningInWithGoogle(true);
    try {
      const email = await signIn();
      if (email) {
        const name =
          googleUser?.name || email.split("@")[0].replace(/[._]/g, " ");
        await loginWithGoogle(email, name);
        toast.success("Signed in successfully!");
        // Check if new user needs to complete profile
        try {
          const raw = localStorage.getItem("proxiis_session");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.profile_complete === false) {
              onNavigate("complete-profile");
              return;
            }
          }
        } catch {
          // ignore parse errors
        }
      } else {
        setIsSigningInWithGoogle(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed.");
      setIsSigningInWithGoogle(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    const tgErr = validateTelegram(telegramHandle);
    if (tgErr) {
      setTelegramError(tgErr);
      toast.error(tgErr);
      return;
    }

    setIsCreatingProfile(true);
    try {
      if (googleUser?.email) {
        await createProfileWithGoogle.mutateAsync({
          name: profileName.trim(),
          gmailAddress: googleUser.email,
        });
        toast.success("Profile created successfully with Google account!");
      } else if (manualGmail.trim()) {
        await saveProfile.mutateAsync({
          name: profileName.trim(),
          gmailAddress: manualGmail.trim(),
          postHistory: [],
        });
        toast.success("Profile created successfully!");
      } else {
        await saveProfile.mutateAsync({
          name: profileName.trim(),
          gmailAddress: undefined,
          postHistory: [],
        });
        toast.success("Profile created successfully!");
      }

      // Save telegram handle to localStorage
      if (identity && telegramHandle.trim()) {
        localStorage.setItem(
          `proxiis_telegram_${identity.getPrincipal().toString()}`,
          telegramHandle.trim(),
        );
      }

      setProfileName("");
      setTelegramHandle("");
      setManualGmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create profile");
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleLogout = () => {
    clear(); // Internet Identity logout
    sheetLogout(); // SheetDB session logout
  };

  // Display name and email from SheetDB session or ICP profile
  const displayName = sheetUser?.name || userProfile?.name || "Profile";
  const displayEmail = sheetUser?.email || userProfile?.gmailAddress || null;

  // ─── STEP: Login ────────────────────────────────────────────────────────────
  if (step === "login") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="backdrop-blur-xl bg-card/30 border-b border-border/50 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("hub")}
              className="hover:bg-[oklch(0.8_0.25_150)]/20 hover:text-[oklch(0.8_0.25_150)]"
              data-ocid="profile.link"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          {/* Loading state while actor/profile is initializing */}
          {isAuthenticated && (userProfileLoading || !isFetched) ? (
            <div
              className="w-full max-w-sm space-y-4"
              data-ocid="profile.loading_state"
            >
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-5 text-center">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] flex items-center justify-center shadow-glow-green">
                  <UserCircle2 className="w-12 h-12 text-black" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                  Welcome to PROXIIS
                </h2>
                <p className="text-muted-foreground">
                  Login to create your account and track your tasks, earnings,
                  and reputation.
                </p>
              </div>

              {/* Google Sign-In */}
              <Button
                variant="outline"
                className="w-full border-border/60 hover:border-[oklch(0.8_0.25_150)]/50 gap-2 font-semibold"
                onClick={handleSheetGoogleSignIn}
                disabled={isSigningInWithGoogle || !googleLoaded}
                data-ocid="profile.secondary_button"
              >
                {isSigningInWithGoogle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SiGoogle className="w-4 h-4 text-[#4285F4]" />
                )}
                {isSigningInWithGoogle
                  ? "Signing in..."
                  : "Sign in with Google"}
              </Button>

              {/* Email / Password */}
              <Button
                variant="outline"
                className="w-full border-border/60 hover:border-[oklch(0.7_0.2_270)]/50 gap-2 font-semibold"
                onClick={() => {
                  setAuthModalTab("signin");
                  setAuthModalOpen(true);
                }}
                data-ocid="profile.secondary_button"
              >
                <Mail className="w-4 h-4" />
                Email / Password
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-3 text-muted-foreground uppercase tracking-widest">
                    or sign in with Internet Identity
                  </span>
                </div>
              </div>

              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-bold py-6 text-base rounded-xl"
                data-ocid="profile.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Login with Internet Identity
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Secure, decentralized authentication — no passwords needed.
              </p>
            </div>
          )}
        </main>

        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          defaultTab={authModalTab}
          onSuccess={() => {
            // currentUser will update reactively; no extra action needed
          }}
          onNeedsProfileCompletion={() => {
            setAuthModalOpen(false);
            onNavigate("complete-profile");
          }}
        />
      </div>
    );
  }

  // ─── STEP: Account Setup ─────────────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="backdrop-blur-xl bg-card/30 border-b border-border/50 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("hub")}
                className="hover:bg-[oklch(0.8_0.25_150)]/20 hover:text-[oklch(0.8_0.25_150)]"
                data-ocid="setup.link"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">Create Account</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              data-ocid="setup.secondary_button"
            >
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] flex items-center justify-center shadow-glow-green">
                  <UserCircle2 className="w-10 h-10 text-black" />
                </div>
              </div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                Join PROXIIS
              </h2>
              <p className="text-muted-foreground text-sm">
                Create your profile to start posting tasks and helping your
                campus community.
              </p>
            </div>

            {/* Form Card */}
            <Card
              className="backdrop-blur-xl bg-card/30 border-[oklch(0.8_0.25_150)]/30"
              data-ocid="setup.card"
            >
              <CardContent className="pt-6 space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      disabled={isCreatingProfile || isSigningInWithGoogle}
                      className="bg-background/60 pl-9"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateProfile()
                      }
                      data-ocid="setup.input"
                    />
                  </div>
                </div>

                {/* Telegram Handle */}
                <div className="space-y-2">
                  <Label htmlFor="telegram" className="text-sm font-semibold">
                    Telegram Handle{" "}
                    <span className="text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="telegram"
                      placeholder="@yourusername"
                      value={telegramHandle}
                      onChange={(e) => handleTelegramChange(e.target.value)}
                      disabled={isCreatingProfile || isSigningInWithGoogle}
                      className={`bg-background/60 pl-9 ${
                        telegramError
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      data-ocid="setup.textarea"
                    />
                  </div>
                  {telegramError && (
                    <p
                      className="text-xs text-destructive flex items-center gap-1"
                      data-ocid="setup.error_state"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {telegramError}
                    </p>
                  )}
                </div>

                {/* Google Sign-In section */}
                {!googleUser ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Link Gmail (Optional)
                        </span>
                      </div>
                    </div>

                    {!googleLoaded && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading Google Sign-In...</span>
                      </div>
                    )}

                    {googleError && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{googleError}</span>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-border/60 hover:border-[oklch(0.8_0.25_150)]/50"
                      onClick={handleGoogleSignIn}
                      disabled={
                        isCreatingProfile ||
                        isSigningInWithGoogle ||
                        !googleLoaded
                      }
                      data-ocid="setup.secondary_button"
                    >
                      {isSigningInWithGoogle ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <SiGoogle className="w-4 h-4 mr-2" />
                          Sign in with Google
                        </>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or enter manually
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gmail" className="text-sm font-medium">
                        Gmail Address (Optional)
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="gmail"
                          type="email"
                          placeholder="your.email@gmail.com"
                          value={manualGmail}
                          onChange={(e) => setManualGmail(e.target.value)}
                          disabled={isCreatingProfile || isSigningInWithGoogle}
                          className="bg-background/60 pl-9"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-[oklch(0.8_0.25_150)]/40 bg-[oklch(0.8_0.25_150)]/10 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[oklch(0.8_0.25_150)]" />
                      <span className="font-semibold">
                        Google Account Connected
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      {googleUser.email}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  onClick={handleCreateProfile}
                  disabled={
                    isCreatingProfile ||
                    isSigningInWithGoogle ||
                    !profileName.trim() ||
                    !!telegramError
                  }
                  className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-bold py-5 rounded-xl"
                  data-ocid="setup.submit_button"
                >
                  {isCreatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Join PROXIIS
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              Your profile is stored securely on the Internet Computer
              blockchain.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ─── STEP: Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="backdrop-blur-xl bg-card/30 border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("hub")}
              className="hover:bg-[oklch(0.8_0.25_150)]/20 hover:text-[oklch(0.8_0.25_150)]"
              data-ocid="dashboard.link"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
              <p className="text-xs text-muted-foreground">
                Your PROXIIS Dashboard
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            data-ocid="dashboard.secondary_button"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-5">
        {/* Dashboard Stats Panel */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Your Stats
          </h2>
          <DashboardStatsPanel />
        </section>

        {/* Personal Information — always shown in dashboard */}
        <Card
          className="backdrop-blur-xl bg-card/30 border-[oklch(0.7_0.2_270)]/40"
          data-ocid="dashboard.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-[oklch(0.7_0.2_270)]" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Name row */}
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Display Name
                </p>
                <p className="text-sm font-medium break-all">{displayName}</p>
              </div>
            </div>

            {/* Gmail row */}
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Email Address
                </p>
                <p className="text-sm font-medium break-all">
                  {displayEmail || "Not provided"}
                </p>
              </div>
            </div>

            {/* Telegram row — only relevant for ICP users */}
            {!sheetUser && (
              <div className="flex items-start gap-3">
                <Send className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Telegram Handle
                  </p>
                  <p className="text-sm font-medium break-all">
                    {storedTelegram || "Not provided"}
                  </p>
                </div>
              </div>
            )}

            {/* SheetDB profile fields */}
            {sheetUser?.full_name && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Full Name
                  </p>
                  <p className="text-sm font-medium break-all">
                    {sheetUser.full_name}
                  </p>
                </div>
              </div>
            )}
            {sheetUser && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <p className="text-sm font-medium break-all">
                    {sheetUser.phone_number || "Not provided"}
                  </p>
                </div>
              </div>
            )}
            {sheetUser && (
              <div className="flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Student ID (SBU ID)
                  </p>
                  <p className="text-sm font-medium break-all">
                    {sheetUser.student_id || "Not provided"}
                  </p>
                </div>
              </div>
            )}
            {sheetUser && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    UPI ID
                  </p>
                  <p className="text-sm font-medium break-all">
                    {sheetUser.upi_id || "Not provided"}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                This information is private and only visible to you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats — only for ICP users who have full profile */}
        {!sheetUser &&
          (isLoading ? (
            <div className="space-y-3" data-ocid="dashboard.loading_state">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="backdrop-blur-xl bg-card/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Trophy className="w-4 h-4 text-[oklch(0.7_0.2_270)]" />
                    User Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <StarRating rating={averageRating} />
                    <span className="text-xl font-bold">
                      {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  {profile && profile.ratingCount > 0n && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on {profile.ratingCount.toString()} rating
                      {profile.ratingCount > 1n ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <DollarSign className="w-4 h-4 text-[oklch(0.8_0.25_150)]" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ₹{profile?.earnings.toString() || "0"}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}

        {/* My Posts Section — shown only for ICP users */}
        {!sheetUser && (
          <Card className="backdrop-blur-xl bg-card/30 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[oklch(0.8_0.25_150)]" />
                My Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postHistoryLoading ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  data-ocid="dashboard.loading_state"
                >
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
              ) : postHistory && postHistory.length > 0 ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  data-ocid="dashboard.list"
                >
                  {postHistory.map((task, index) => (
                    <div
                      key={task.id.toString()}
                      data-ocid={`dashboard.item.${index + 1}`}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-8 space-y-2"
                  data-ocid="dashboard.empty_state"
                >
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground">
                    You haven't created any posts yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start by creating your first task in the Hub
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Welcome card for SheetDB-only users */}
        {sheetUser && (
          <Card className="backdrop-blur-xl bg-card/30 border-[oklch(0.8_0.25_150)]/30">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-muted-foreground text-center">
                🎉 Welcome to PROXIIS! Browse tasks in the Hub and start earning
                today.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Motivational footer for ICP users */}
        {!sheetUser && (
          <Card className="backdrop-blur-xl bg-card/30 border-[oklch(0.8_0.25_150)]/30">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-muted-foreground text-center">
                Complete more tasks to increase your earnings and build your
                reputation on campus! 🚀
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
