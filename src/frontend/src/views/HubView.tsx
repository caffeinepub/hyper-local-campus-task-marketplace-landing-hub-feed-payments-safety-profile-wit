import { Button } from "@/components/ui/button";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import AuthPromptDialog from "../components/AuthPromptDialog";
import CategorySelector from "../components/CategorySelector";
import FilterBar, { type FilterType } from "../components/FilterBar";
import HubTopBar from "../components/HubTopBar";
import PostTaskModal from "../components/PostTaskModal";
import TaskCard from "../components/TaskCard";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useProfile";
import { useGetTasks } from "../hooks/useTasks";

interface HubViewProps {
  onNavigate: (view: View) => void;
  onOpenChat?: (taskId: bigint, taskTitle: string, creatorId: string) => void;
}

export default function HubView({ onNavigate, onOpenChat }: HubViewProps) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasks();
  const {
    data: userProfile,
    isLoading: _profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<
    "view-task" | "post-task"
  >("post-task");
  const [sortFilter, setSortFilter] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { currentUser: sheetUser } = useSheetAuth();

  const isAuthenticated = !!identity;
  const isActorReady = !!actor && !actorLoading;
  const hasProfile =
    sheetUser !== null ||
    (isAuthenticated &&
      profileFetched &&
      userProfile !== null &&
      userProfile !== undefined);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || task.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortFilter) {
        case "newest":
          return Number(b.id - a.id);
        case "urgent":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return Number(a.deadline - b.deadline);
        case "paying":
          return Number(b.price - a.price);
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, selectedCategory, sortFilter, searchQuery]);

  const handlePostTask = () => {
    // SheetDB users can post tasks directly — no actor check needed
    if (sheetUser) {
      setIsPostModalOpen(true);
      return;
    }
    if (!isAuthenticated) {
      setAuthPromptReason("post-task");
      setIsAuthPromptOpen(true);
      return;
    }
    if (!isActorReady) {
      // Still booting — treat as unauthenticated and prompt login
      setAuthPromptReason("post-task");
      setIsAuthPromptOpen(true);
      return;
    }
    if (!hasProfile) {
      toast.info("Please create your PROXIIS profile first");
      onNavigate("profile");
      return;
    }
    setIsPostModalOpen(true);
  };

  const handlePostTaskAfterLogin = () => {
    if (!hasProfile) {
      onNavigate("profile");
    } else {
      setIsPostModalOpen(true);
    }
  };

  const handleNavigateToProfile = () => {
    onNavigate("profile");
  };

  const renderEmptyState = () => {
    if (selectedCategory) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">
              No tasks in "{selectedCategory}"
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Try a different category or{" "}
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-transparent bg-clip-text bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] font-semibold hover:opacity-80 transition-opacity"
              >
                view all tasks
              </button>
            </p>
          </div>
        </div>
      );
    }

    if (searchQuery) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">
              No results for "{searchQuery}"
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Try a different search term
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="col-span-full text-center py-12">
        <p className="text-muted-foreground text-lg">No tasks available</p>
      </div>
    );
  };

  const renderFeed = () => {
    if (actorLoading) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[oklch(0.8_0.25_150)] border-t-transparent" />
          <p className="text-muted-foreground">Connecting...</p>
        </div>
      );
    }

    if (tasksLoading) {
      return (
        <div className="col-span-full text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[oklch(0.8_0.25_150)] border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading tasks...</p>
        </div>
      );
    }

    if (filteredAndSortedTasks.length === 0) {
      return renderEmptyState();
    }

    return (
      <>
        {filteredAndSortedTasks.map((task) => (
          <TaskCard
            key={task.id.toString()}
            task={task}
            isAuthenticated={isAuthenticated}
            onOpenChat={onOpenChat}
          />
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <HubTopBar
        onNavigate={onNavigate}
        onNavigateToProfile={handleNavigateToProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMessages={() => onNavigate("chat")}
      />

      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <FilterBar activeFilter={sortFilter} onFilterChange={setSortFilter} />
      </div>

      <div className="sticky top-[72px] z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Guest banner — subtle, non-blocking */}
      {!isAuthenticated && !sheetUser && !actorLoading && (
        <div className="max-w-5xl mx-auto w-full px-5 pt-5">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[oklch(0.8_0.25_150)]/10 to-[oklch(0.7_0.2_270)]/10 border border-[oklch(0.8_0.25_150)]/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              👋{" "}
              <span className="font-medium text-foreground">
                Browsing as guest.
              </span>{" "}
              Login to post tasks or view full details.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setAuthPromptReason("view-task");
                setIsAuthPromptOpen(true);
              }}
              className="bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold rounded-full text-xs px-4 flex-shrink-0"
            >
              Login
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderFeed()}
        </div>
      </main>

      {/* Post Task FAB */}
      <Button
        onClick={handlePostTask}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black z-40"
        size="icon"
      >
        <Plus className="w-8 h-8" />
      </Button>

      <PostTaskModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      {/* Auth prompt dialog */}
      <AuthPromptDialog
        open={isAuthPromptOpen}
        onOpenChange={setIsAuthPromptOpen}
        reason={authPromptReason}
        onLoginSuccess={
          authPromptReason === "post-task"
            ? handlePostTaskAfterLogin
            : undefined
        }
        onNeedsProfileCompletion={() => onNavigate("complete-profile")}
      />
    </div>
  );
}
