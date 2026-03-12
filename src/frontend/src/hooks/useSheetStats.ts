import {
  type PostHistoryRow2,
  type TaskHistoryRow,
  getPostHistory2,
  getTaskHistory,
} from "@/utils/sheetdb";
import { useQuery } from "@tanstack/react-query";

export function useSheetTaskHistory(user_id: string | undefined) {
  return useQuery<TaskHistoryRow[]>({
    queryKey: ["sheetTaskHistory", user_id],
    queryFn: () => getTaskHistory(user_id!),
    enabled: !!user_id,
    retry: false,
  });
}

export function useSheetPostHistory(user_id: string | undefined) {
  return useQuery<PostHistoryRow2[]>({
    queryKey: ["sheetPostHistory", user_id],
    queryFn: () => getPostHistory2(user_id!),
    enabled: !!user_id,
    retry: false,
  });
}
