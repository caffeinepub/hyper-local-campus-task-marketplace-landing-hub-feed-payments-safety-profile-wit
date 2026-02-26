import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { TaskId, Stars } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';

export function useAssignPerformer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: TaskId) => {
      if (!actor) {
        throw new Error('Actor not available. Please ensure you are logged in.');
      }
      return actor.assignPerformer(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { taskId: TaskId; photo: ExternalBlob }) => {
      if (!actor) {
        throw new Error('Actor not available. Please ensure you are logged in.');
      }
      return actor.completeTask(data.taskId, data.photo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useVerifyTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      taskId: TaskId;
      rating: Stars;
      performer: Principal;
    }) => {
      if (!actor) {
        throw new Error('Actor not available. Please ensure you are logged in.');
      }
      return actor.verifyTask(data.taskId, data.rating, data.performer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useToggleTelegramDiscussion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { taskId: bigint; enabled: boolean }) => {
      if (!actor) {
        throw new Error('Actor not available. Please ensure you are logged in.');
      }
      return actor.toggleTelegramDiscussion(data.taskId, data.enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: TaskId) => {
      if (!actor) {
        throw new Error('Actor not available. Please ensure you are logged in.');
      }
      return actor.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
