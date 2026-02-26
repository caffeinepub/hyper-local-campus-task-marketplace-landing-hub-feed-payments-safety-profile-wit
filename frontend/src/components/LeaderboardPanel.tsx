import { useGetLeaderboard } from '@/hooks/useLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp } from 'lucide-react';

export default function LeaderboardPanel() {
  const { data: leaderboard = [], isLoading } = useGetLeaderboard();

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No users on the leaderboard yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      {leaderboard.slice(0, 10).map((profile, index) => {
        const averageRating = profile.ratingCount > 0n
          ? (Number(profile.ratingSum) / Number(profile.ratingCount)).toFixed(1)
          : 'N/A';

        return (
          <div 
            key={index}
            className="backdrop-blur-xl bg-background/50 border border-border rounded-xl p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
              index === 0 ? 'bg-[oklch(0.8_0.25_150)]/20 text-[oklch(0.8_0.25_150)]' :
              index === 1 ? 'bg-[oklch(0.7_0.2_270)]/20 text-[oklch(0.7_0.2_270)]' :
              index === 2 ? 'bg-muted text-muted-foreground' :
              'bg-muted/50 text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[oklch(0.8_0.25_150)]" />
                  <span className="font-semibold">₹{profile.earnings.toString()}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {profile.tasksCompleted.toString()} tasks
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rating: {averageRating} ⭐
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
