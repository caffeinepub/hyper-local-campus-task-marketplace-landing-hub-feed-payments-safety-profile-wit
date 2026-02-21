import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Task, TaskId } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetTasks() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTasks();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSearchTasks(search: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'search', search],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchTasks(search);
    },
    enabled: !!actor && !actorFetching && search.length > 0,
    retry: false,
  });
}

export function useUserPostHistory(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', 'userPostHistory', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!userPrincipal) throw new Error('User principal not available');
      return actor.getTasksByUser(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
    retry: false,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      category: string;
      price: bigint;
      location: string;
      safeSpot: string;
      telegramHandle: string;
      photo: ExternalBlob;
      deadline: bigint | null;
    }) => {
      if (!actor) {
        throw new Error('Actor not available. Please ensure you are logged in and try again.');
      }
      return actor.createTask(
        data.title,
        data.category,
        data.price,
        data.location,
        data.safeSpot,
        data.telegramHandle,
        data.photo,
        data.deadline
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
