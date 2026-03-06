import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import CompleteProfileView from "./views/CompleteProfileView";
import DMView, { type ChatContext } from "./views/DMView";
import HubView from "./views/HubView";
import LandingView from "./views/LandingView";
import ProfileView from "./views/ProfileView";

export type View = "landing" | "hub" | "profile" | "chat" | "complete-profile";

function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);

  const handleOpenChat = (
    taskId: bigint,
    taskTitle: string,
    creatorId: string,
  ) => {
    // viewerId is a placeholder — the DMView derives it from the current user context stored in localStorage.
    // We set it as the creatorId here; DMView will resolve identities via chatContext.
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
          <ProfileView onNavigate={setCurrentView} />
        )}
        {currentView === "chat" && (
          <DMView chatContext={chatContext} onNavigate={setCurrentView} />
        )}
        {currentView === "complete-profile" && (
          <CompleteProfileView onComplete={() => setCurrentView("hub")} />
        )}
      </div>

      <Toaster />
    </div>
  );
}

export default App;
