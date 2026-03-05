import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type FilterType = "newest" | "urgent" | "paying" | null;

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterBar({
  activeFilter,
  onFilterChange,
}: FilterBarProps) {
  return (
    <ScrollArea className="w-full scroll-smooth">
      <div className="flex gap-3 px-5 py-4">
        <Button
          variant={activeFilter === "newest" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFilterChange(activeFilter === "newest" ? null : "newest")
          }
          className={
            activeFilter === "newest"
              ? "bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black hover:opacity-90 font-semibold px-5 rounded-full transition-all shadow-glow-green"
              : "backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-primary/40 rounded-full transition-all"
          }
        >
          Newest <span className="ml-1.5">🌱</span>
        </Button>

        <Button
          variant={activeFilter === "urgent" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFilterChange(activeFilter === "urgent" ? null : "urgent")
          }
          className={
            activeFilter === "urgent"
              ? "bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black hover:opacity-90 font-semibold px-5 rounded-full transition-all shadow-glow-green whitespace-nowrap"
              : "backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-primary/40 rounded-full transition-all whitespace-nowrap"
          }
        >
          Most Urgent <span className="ml-1.5">🔥</span>
        </Button>

        <Button
          variant={activeFilter === "paying" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFilterChange(activeFilter === "paying" ? null : "paying")
          }
          className={
            activeFilter === "paying"
              ? "bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black hover:opacity-90 font-semibold px-5 rounded-full transition-all shadow-glow-green whitespace-nowrap"
              : "backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-primary/40 rounded-full transition-all whitespace-nowrap"
          }
        >
          Highest Paying <span className="ml-1.5">💰</span>
        </Button>
      </div>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}
