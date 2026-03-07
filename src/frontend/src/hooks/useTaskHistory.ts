import {
  type PerformerHistoryRow,
  type PosterHistoryRow,
  getPerformerHistory,
  getPosterHistory,
} from "@/utils/sheetdb";
import { useQuery } from "@tanstack/react-query";

export function usePerformerHistory(user_id: string | undefined) {
  return useQuery<PerformerHistoryRow[]>({
    queryKey: ["performerHistory", user_id],
    queryFn: () => getPerformerHistory(user_id!),
    enabled: !!user_id,
    retry: false,
  });
}

export function usePosterHistory(user_id: string | undefined) {
  return useQuery<PosterHistoryRow[]>({
    queryKey: ["posterHistory", user_id],
    queryFn: () => getPosterHistory(user_id!),
    enabled: !!user_id,
    retry: false,
  });
}
