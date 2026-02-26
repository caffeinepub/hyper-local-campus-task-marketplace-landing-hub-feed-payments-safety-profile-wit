import { CheckCircle, Trophy, Star, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCallerProfileStats } from '@/hooks/useProfile';

export default function DashboardStatsPanel() {
  const { data: stats, isLoading } = useGetCallerProfileStats();

  const averageRating =
    stats && stats.ratingCount > 0n
      ? (Number(stats.ratingSum) / Number(stats.ratingCount)).toFixed(1)
      : null;

  const statCards = [
    {
      label: 'Tasks Completed',
      value: stats ? stats.tasksCompleted.toString() : '0',
      icon: CheckCircle,
      gradient: 'from-[oklch(0.8_0.25_150)] to-[oklch(0.75_0.22_200)]',
      glow: 'shadow-glow-green',
      border: 'border-[oklch(0.8_0.25_150)]/40',
    },
    {
      label: 'User Rating',
      value: averageRating ? `${averageRating} ★` : 'N/A',
      icon: Trophy,
      gradient: 'from-[oklch(0.7_0.2_270)] to-[oklch(0.75_0.22_200)]',
      glow: 'shadow-glow-purple',
      border: 'border-[oklch(0.7_0.2_270)]/40',
    },
    {
      label: 'Total Ratings',
      value: stats ? stats.totalRatingsCount.toString() : '0',
      icon: Star,
      gradient: 'from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)]',
      glow: 'shadow-glow-teal',
      border: 'border-[oklch(0.75_0.22_200)]/40',
    },
    {
      label: 'Tasks Posted',
      value: stats ? stats.tasksPosted.toString() : '0',
      icon: FileText,
      gradient: 'from-[oklch(0.7_0.2_270)] to-[oklch(0.8_0.25_150)]',
      glow: 'shadow-glow-green',
      border: 'border-[oklch(0.8_0.25_150)]/30',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl backdrop-blur-xl bg-card/30 border ${card.border} p-4 flex flex-col gap-2 ${card.glow}`}
          >
            {/* Gradient accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`}
            />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
              >
                <Icon className="w-4 h-4 text-black" />
              </div>
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                {card.label}
              </span>
            </div>
            <p
              className={`text-3xl font-black bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent leading-none`}
            >
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
