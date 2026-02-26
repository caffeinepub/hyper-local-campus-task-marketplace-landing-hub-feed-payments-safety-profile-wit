import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskDetailsSheet from './TaskDetailsSheet';
import { formatDeadline } from '@/utils/time';
import { useGetCallerUserProfile } from '@/hooks/useProfile';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { Task } from '@/backend';
import { MapPin, IndianRupee, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const { data: userProfile, isFetched: profileFetched } = useGetCallerUserProfile();
  const formattedDeadline = formatDeadline(task.deadline);

  const isAuthenticated = !!identity;
  const hasProfile = userProfile !== null;

  const handleCardClick = () => {
    if (isAuthenticated && profileFetched && !hasProfile) {
      toast.error('Please create an account first on proxy to view task details');
      return;
    }
    setIsDetailsOpen(true);
  };

  return (
    <>
      <Card
        className="backdrop-blur-xl bg-card/30 border border-border/50 hover:border-[oklch(0.8_0.25_150)]/60 hover:shadow-glow-green transition-all duration-300 cursor-pointer overflow-hidden group"
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* Task Photo */}
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={task.taskPhoto.getDirectURL()}
              alt={task.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            {/* Category Badge */}
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black border-none backdrop-blur-sm shadow-lg font-semibold px-3 py-1">
              {task.category}
            </Badge>
          </div>

          {/* Task Info */}
          <div className="p-5 space-y-4">
            <h3 className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-[oklch(0.8_0.25_150)] transition-colors">
              {task.title}
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[oklch(0.75_0.22_200)]" />
                <span className="truncate">{task.location}</span>
              </div>

              {formattedDeadline && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 flex-shrink-0 text-[oklch(0.7_0.2_270)]" />
                  <span className="truncate">{formattedDeadline}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <IndianRupee className="w-6 h-6 text-[oklch(0.8_0.25_150)]" />
              <span className="text-2xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                {task.price.toString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailsSheet
        task={task}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
}
