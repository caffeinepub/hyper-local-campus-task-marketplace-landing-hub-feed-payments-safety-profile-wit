import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  GraduationCap,
  Loader2,
  Phone,
  User,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CompleteProfileViewProps {
  onComplete: () => void;
}

export default function CompleteProfileView({
  onComplete,
}: CompleteProfileViewProps) {
  const { currentUser: sheetUser, saveProfileDetails } = useSheetAuth();

  const [fullName, setFullName] = useState(sheetUser?.name || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!studentId.trim()) {
      setError("Student ID (SBU ID) is required.");
      return;
    }
    if (!upiId.trim()) {
      setError("UPI ID is required.");
      return;
    }

    if (!sheetUser?.user_id) {
      setError("Session expired. Please log in again.");
      return;
    }

    setIsSaving(true);
    try {
      await saveProfileDetails(
        sheetUser.user_id,
        fullName.trim(),
        phoneNumber.trim(),
        studentId.trim(),
        upiId.trim(),
      );
      toast.success("Profile completed! Welcome to PROXIIS 🎉");
      onComplete();
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    // Mark session as complete without saving new fields
    if (sheetUser?.user_id) {
      saveProfileDetails(sheetUser.user_id, "", "", "", "").catch(() => {
        // silently ignore skip save errors
      });
    }
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-xl bg-card/30 border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="hover:bg-[oklch(0.8_0.25_150)]/20 hover:text-[oklch(0.8_0.25_150)]"
            aria-label="Skip for now"
            data-ocid="complete-profile.secondary_button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Complete Your Profile</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Hero icon + title */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] flex items-center justify-center shadow-[0_0_24px_oklch(0.8_0.25_150/0.4)]">
                <UserCircle2 className="w-10 h-10 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
              Almost There!
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Add a few more details to complete your PROXIIS profile.
            </p>
          </div>

          {/* Form Card */}
          <Card
            className="backdrop-blur-xl bg-card/30 border-[oklch(0.8_0.25_150)]/30"
            data-ocid="complete-profile.card"
          >
            <CardContent className="pt-6 space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="cp-fullname"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cp-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSaving}
                    className="bg-background/60 pl-9"
                    autoComplete="name"
                    data-ocid="complete-profile.input"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="cp-phone"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cp-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSaving}
                    className="bg-background/60 pl-9"
                    autoComplete="tel"
                    data-ocid="complete-profile.input"
                  />
                </div>
              </div>

              {/* Student ID / SBU ID */}
              <div className="space-y-2">
                <Label
                  htmlFor="cp-studentid"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Student ID (SBU ID){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cp-studentid"
                    type="text"
                    placeholder="e.g. SBU2024001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={isSaving}
                    className="bg-background/60 pl-9"
                    data-ocid="complete-profile.input"
                  />
                </div>
              </div>

              {/* UPI ID */}
              <div className="space-y-2">
                <Label
                  htmlFor="cp-upi"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  UPI ID <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cp-upi"
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={isSaving}
                    className="bg-background/60 pl-9"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    data-ocid="complete-profile.input"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg"
                  data-ocid="complete-profile.error_state"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-bold py-5 rounded-xl"
                data-ocid="complete-profile.submit_button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Skip link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSaving}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              data-ocid="complete-profile.secondary_button"
            >
              Skip for now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
