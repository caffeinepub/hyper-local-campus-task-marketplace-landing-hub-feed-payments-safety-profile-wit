import { Toaster } from "@/components/ui/sonner";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import { useEffect, useState } from "react";
import CompleteProfileView from "./views/CompleteProfileView";
import DMView, { type ChatContext } from "./views/DMView";
import HubView from "./views/HubView";
import LandingView from "./views/LandingView";
import ProfileView from "./views/ProfileView";

export type View = "landing" | "hub" | "profile" | "chat" | "complete-profile";

function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [profileJustCreated, setProfileJustCreated] = useState(false);
  // Prevents the guard effect from re-triggering "complete-profile" right after
  // the user submits the form (race condition: sheetUser still has stale profile_complete===false).
  const [profileCompleted, setProfileCompleted] = useState(false);
  const { currentUser: sheetUser, isInitializing } = useSheetAuth();

  // Global guard: whenever a SheetDB session exists with profile_complete === false,
  // redirect to the complete-profile screen regardless of which view is active.
  // Skipped when profileCompleted is true to avoid a re-entry race condition.
  useEffect(() => {
    if (
      !isInitializing &&
      sheetUser &&
      sheetUser.profile_complete === false &&
      !profileCompleted
    ) {
      setCurrentView("complete-profile");
    }
  }, [sheetUser, isInitializing, profileCompleted]);

  const handleOpenChat = (
    taskId: bigint | string,
    taskTitle: string,
    creatorId: string,
  ) => {
    // viewerId is derived from creatorId here; DMView resolves via chatContext
    setChatContext({ taskId, taskTitle, creatorId, viewerId: creatorId });
    setCurrentView("chat");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Neon grid background */}
      <div
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "url(/assets/generated/neon-grid-bg.dim_1920x1080.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {currentView === "landing" && (
          <LandingView onNavigate={setCurrentView} />
        )}
        {currentView === "hub" && (
          <HubView onNavigate={setCurrentView} onOpenChat={handleOpenChat} />
        )}
        {currentView === "profile" && (
          <ProfileView
            onNavigate={setCurrentView}
            showWelcomeBanner={profileJustCreated}
            onWelcomeBannerSeen={() => setProfileJustCreated(false)}
            forceProfileComplete={profileCompleted}
          />
        )}
        {currentView === "chat" && (
          <DMView chatContext={chatContext} onNavigate={setCurrentView} />
        )}
        {currentView === "complete-profile" && (
          <CompleteProfileView
            onComplete={() => {
              setProfileCompleted(true);
              setProfileJustCreated(true);
              setCurrentView("profile");
            }}
          />
        )}
      </div>

      <Toaster />
    </div>
  );
}

export default App;
