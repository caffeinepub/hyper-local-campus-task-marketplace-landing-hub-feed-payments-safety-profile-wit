import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LeaderboardPanel from './LeaderboardPanel';
import { Search, Bell, Trophy, User } from 'lucide-react';
import type { View } from '../App';

interface HubTopBarProps {
  onNavigate: (view: View) => void;
  onNavigateToProfile: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function HubTopBar({ onNavigate, onNavigateToProfile, searchQuery, onSearchChange }: HubTopBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="backdrop-blur-xl bg-card/30 border-b border-border/50 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-5 py-5">
        <div className="relative flex items-center justify-center">
          {/* Centered Title — matches landing page gradient exactly */}
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
            PROXIIS
          </h1>

          {/* Right-aligned Actions */}
          <div className="absolute right-0 flex items-center gap-3">
            {/* Search */}
            {isSearchOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="backdrop-blur-xl bg-background/60 border-border/80 w-52 focus-visible:ring-primary"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange('');
                  }}
                  className="hover:bg-muted/50"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-secondary/10 hover:text-secondary transition-colors"
                >
                  <Bell className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="backdrop-blur-xl bg-card/95 border-border/80 w-80">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Leaderboard */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  <Trophy className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="backdrop-blur-xl bg-card/95 border-border/80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <Trophy className="w-6 h-6 text-accent" />
                    Leaderboard
                  </SheetTitle>
                </SheetHeader>
                <LeaderboardPanel />
              </SheetContent>
            </Sheet>

            {/* Profile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateToProfile}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
