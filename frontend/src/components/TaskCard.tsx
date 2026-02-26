import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskDetailsSheet from './TaskDetailsSheet';
import { formatDeadline } from '@/utils/time';
import { useGetCallerUserProfile } from '@/hooks/useProfile';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useAuthPrompt } from '@/App';
import type { Task } from '@/backend';
import { MapPin, IndianRupee, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const { data: userProfile, isFetched: profileFetched } = useGetCallerUserProfile();
  const { showAuthPrompt } = useAuthPrompt();
  const formattedDeadline = formatDeadline(task.deadline);

  const isAuthenticated = !!identity;
  const hasProfile = userProfile !== null;

  const handleCardClick = () => {
    if (!isAuthenticated) {
      showAuthPrompt();
      return;
    }
    if (isAuthenticated && profileFetched && !hasProfile) {
      showAuthPrompt();
      return;
    }
    setIsDetailsOpen(true);
  };

  return (
    <>
      <Card
        className="backdrop-blur-xl bg-card/40 border-border/60 hover:border-primary/60 hover:shadow-glow-coral transition-all duration-300 cursor-pointer overflow-hidden group"
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
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent text-primary-foreground border-none backdrop-blur-sm shadow-lg font-semibold px-3 py-1">
              {task.category}
            </Badge>
          </div>

          {/* Task Info */}
          <div className="p-5 space-y-4">
            <h3 className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {task.title}
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 text-secondary" />
                <span className="truncate">{task.location}</span>
              </div>

              {formattedDeadline && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span className="truncate">{formattedDeadline}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <IndianRupee className="w-6 h-6 text-primary" />
              <span className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {task.price.toString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailsSheet task={task} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </>
  );
}
