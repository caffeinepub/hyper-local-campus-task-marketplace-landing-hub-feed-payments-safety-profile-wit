import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskId } from "../backend";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetTasks() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<Task[]>({
    queryKey: ["tasks", isAuthenticated ? "authenticated" : "anonymous"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (isAuthenticated) {
        // Authenticated users use getTasks() which returns all active tasks
        return actor.getTasks();
      }
      // Anonymous users use searchTasks('') which is a public endpoint
      return actor.searchTasks("");
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSearchTasks(search: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["tasks", "search", search],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.searchTasks(search);
    },
    enabled: !!actor && !actorFetching && search.length > 0,
    retry: false,
  });
}

export function useUserPostHistory(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["tasks", "userPostHistory", userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (!userPrincipal) throw new Error("User principal not available");
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
        throw new Error(
          "Actor not available. Please ensure you are logged in and try again.",
        );
      }
      return actor.createTask(
        data.title,
        data.category,
        data.price,
        data.location,
        data.safeSpot,
        data.telegramHandle,
        data.photo,
        data.deadline,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
