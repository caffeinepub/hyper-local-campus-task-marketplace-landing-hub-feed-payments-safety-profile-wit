import type { Task } from "@/backend";
import { Button } from "@/components/ui/button";
import { useSheetAuth } from "@/hooks/useSheetAuth";
import type { SheetTask } from "@/utils/sheetdb";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import AuthPromptDialog from "../components/AuthPromptDialog";
import CategorySelector from "../components/CategorySelector";
import FilterBar, { type FilterType } from "../components/FilterBar";
import HubTopBar from "../components/HubTopBar";
import PostTaskModal from "../components/PostTaskModal";
import SheetTaskCard from "../components/SheetTaskCard";
import TaskCard from "../components/TaskCard";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useProfile";
import { useInvalidateSheetTasks, useSheetTasks } from "../hooks/useSheetTasks";
import { useGetTasks } from "../hooks/useTasks";

type UnifiedTask =
  | { kind: "icp"; data: Task }
  | { kind: "sheet"; data: SheetTask };

interface HubViewProps {
  onNavigate: (view: View) => void;
  onOpenChat?: (
    taskId: bigint | string,
    taskTitle: string,
    creatorId: string,
  ) => void;
}

export default function HubView({ onNavigate, onOpenChat }: HubViewProps) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasks();
  const { data: sheetTasks = [], isLoading: sheetTasksLoading } =
    useSheetTasks();
  const invalidateSheetTasks = useInvalidateSheetTasks();
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

  const isAuthenticated = !!identity || !!sheetUser;
  const isActorReady = !!actor && !actorLoading;
  const hasProfile =
    sheetUser !== null ||
    (!!identity &&
      profileFetched &&
      userProfile !== null &&
      userProfile !== undefined);

  const filteredAndSortedTasks = useMemo(() => {
    // Build unified list
    const icpUnified: UnifiedTask[] = tasks
      .filter((task) => {
        const matchesSearch =
          !searchQuery ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === null || task.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .map((t) => ({ kind: "icp" as const, data: t }));

    const sheetUnified: UnifiedTask[] = sheetTasks
      .filter((task) => {
        const matchesSearch =
          !searchQuery ||
          task.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.category ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          task.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === null || task.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .map((t) => ({ kind: "sheet" as const, data: t }));

    const unified = [...icpUnified, ...sheetUnified];

    if (!sortFilter) return unified;

    return [...unified].sort((a, b) => {
      if (sortFilter === "newest") {
        const tsA =
          a.kind === "icp"
            ? Number(a.data.id)
            : new Date(a.data.date_posted || 0).getTime();
        const tsB =
          b.kind === "icp"
            ? Number(b.data.id)
            : new Date(b.data.date_posted || 0).getTime();
        return tsB - tsA;
      }

      if (sortFilter === "urgent") {
        const dlA =
          a.kind === "icp"
            ? a.data.deadline
              ? Number(a.data.deadline)
              : null
            : a.data.deadline
              ? new Date(a.data.deadline).getTime()
              : null;
        const dlB =
          b.kind === "icp"
            ? b.data.deadline
              ? Number(b.data.deadline)
              : null
            : b.data.deadline
              ? new Date(b.data.deadline).getTime()
              : null;
        if (dlA === null && dlB === null) return 0;
        if (dlA === null) return 1;
        if (dlB === null) return -1;
        return dlA - dlB;
      }

      if (sortFilter === "paying") {
        const priceA =
          a.kind === "icp"
            ? Number(a.data.price)
            : Number.parseFloat(a.data.price || "0");
        const priceB =
          b.kind === "icp"
            ? Number(b.data.price)
            : Number.parseFloat(b.data.price || "0");
        return priceB - priceA;
      }

      return 0;
    });
  }, [tasks, sheetTasks, selectedCategory, sortFilter, searchQuery]);

  const handlePostTask = () => {
    if (sheetUser) {
      setIsPostModalOpen(true);
      return;
    }
    if (!identity) {
      setAuthPromptReason("post-task");
      setIsAuthPromptOpen(true);
      return;
    }
    if (!isActorReady) {
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

  const handleOpenSheetChat = (
    taskId: string,
    taskTitle: string,
    creatorId: string,
  ) => {
    onOpenChat?.(taskId, taskTitle, creatorId);
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
    if (actorLoading || sheetTasksLoading) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[oklch(0.8_0.25_150)] border-t-transparent" />
          <p className="text-muted-foreground">Loading tasks...</p>
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
        {filteredAndSortedTasks.map((item) => {
          if (item.kind === "icp") {
            return (
              <TaskCard
                key={`icp_${item.data.id.toString()}`}
                task={item.data}
                isAuthenticated={!!identity}
                onOpenChat={
                  onOpenChat as
                    | ((
                        taskId: bigint,
                        taskTitle: string,
                        creatorId: string,
                      ) => void)
                    | undefined
                }
              />
            );
          }
          return (
            <SheetTaskCard
              key={`sheet_${item.data.task_id}`}
              task={item.data}
              isAuthenticated={isAuthenticated}
              onOpenChat={handleOpenSheetChat}
            />
          );
        })}
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
      {!identity && !sheetUser && !actorLoading && (
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
        data-ocid="hub.post_task.button"
      >
        <Plus className="w-8 h-8" />
      </Button>

      <PostTaskModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onTaskPosted={invalidateSheetTasks}
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
