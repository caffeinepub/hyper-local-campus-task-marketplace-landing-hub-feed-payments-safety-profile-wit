import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type SheetTask, getAllSheetTasks } from "../utils/sheetdb";

export function useSheetTasks() {
  return useQuery<SheetTask[]>({
    queryKey: ["sheetTasks"],
    queryFn: getAllSheetTasks,
    refetchInterval: 30000,
    retry: false,
  });
}

/** Call this after posting a task to immediately refresh the feed. */
export function useInvalidateSheetTasks() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["sheetTasks"] });
}
