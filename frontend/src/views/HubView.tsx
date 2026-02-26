import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import HubTopBar from '../components/HubTopBar';
import CategorySelector from '../components/CategorySelector';
import TaskCard from '../components/TaskCard';
import PostTaskModal from '../components/PostTaskModal';
import FilterBar, { type FilterType } from '../components/FilterBar';
import { useGetTasks } from '../hooks/useTasks';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useGetCallerUserProfile } from '../hooks/useProfile';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { View } from '../App';

interface HubViewProps {
  onNavigate: (view: View) => void;
}

export default function HubView({ onNavigate }: HubViewProps) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasks();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [sortFilter, setSortFilter] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthenticated = !!identity;
  const isActorReady = !!actor && !actorLoading;
  const hasProfile = userProfile !== null;

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === null || task.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortFilter) {
        case 'newest':
          return Number(b.id - a.id);
        case 'urgent':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return Number(a.deadline - b.deadline);
        case 'paying':
          return Number(b.price - a.price);
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, selectedCategory, sortFilter, searchQuery]);

  const handlePostTask = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to post a task');
      return;
    }
    if (!isActorReady) {
      toast.error('Connection is still initializing. Please wait a moment and try again.');
      return;
    }
    if (!hasProfile) {
      toast.error('Please create an account first on proxy to post tasks');
      return;
    }
    setIsPostModalOpen(true);
  };

  const handleNavigateToProfile = () => {
    onNavigate('profile');
  };

  // Show authentication prompt if user doesn't have a profile
  const showAuthPrompt = isAuthenticated && !profileLoading && profileFetched && !hasProfile;

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <HubTopBar
        onNavigate={onNavigate}
        onNavigateToProfile={handleNavigateToProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {!showAuthPrompt && (
        <>
          <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
            <FilterBar activeFilter={sortFilter} onFilterChange={setSortFilter} />
          </div>

          <div className="sticky top-[72px] z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        {showAuthPrompt ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md space-y-6 p-8 rounded-2xl backdrop-blur-xl bg-card/30 border border-border/50">
              <div className="space-y-2">
                <h2 className="text-3xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                  Account Required
                </h2>
                <p className="text-muted-foreground text-lg">
                  You need to create an account on{' '}
                  <span className="font-bold text-[oklch(0.8_0.25_150)]">proxy</span>{' '}
                  to view and post tasks.
                </p>
              </div>
              <Button
                onClick={handleNavigateToProfile}
                className="bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-[oklch(0.8_0.25_150)]/50"
              >
                Create Account
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasksLoading || actorLoading || profileLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[oklch(0.8_0.25_150)] border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">
                  {actorLoading ? 'Connecting...' : profileLoading ? 'Loading profile...' : 'Loading tasks...'}
                </p>
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">No tasks available</p>
              </div>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <TaskCard key={task.id.toString()} task={task} />
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button — always visible, validation handled in handlePostTask */}
      <Button
        onClick={handlePostTask}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black z-50 transition-transform hover:scale-110 active:scale-95"
        size="icon"
        aria-label="Post a new task"
      >
        <Plus className="w-8 h-8" />
      </Button>

      <PostTaskModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </div>
  );
}
