import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Profile } from '@/backend';

export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}
