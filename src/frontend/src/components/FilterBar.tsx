import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export type FilterType = 'newest' | 'urgent' | 'paying' | null;

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <ScrollArea className="w-full scroll-smooth">
      <div className="flex gap-3 px-5 py-4">
        <Button
          variant={activeFilter === 'newest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(activeFilter === 'newest' ? null : 'newest')}
          className={
            activeFilter === 'newest'
              ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold px-5 rounded-full transition-all shadow-lg'
              : 'backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-blue-400/40 rounded-full transition-all'
          }
        >
          Newest
        </Button>
        
        <Button
          variant={activeFilter === 'urgent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(activeFilter === 'urgent' ? null : 'urgent')}
          className={
            activeFilter === 'urgent'
              ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold px-5 rounded-full transition-all shadow-lg whitespace-nowrap'
              : 'backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-blue-400/40 rounded-full transition-all whitespace-nowrap'
          }
        >
          Most Urgent <span className="ml-1.5">🔥</span>
        </Button>
        
        <Button
          variant={activeFilter === 'paying' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(activeFilter === 'paying' ? null : 'paying')}
          className={
            activeFilter === 'paying'
              ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold px-5 rounded-full transition-all shadow-lg whitespace-nowrap'
              : 'backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-blue-400/40 rounded-full transition-all whitespace-nowrap'
          }
        >
          Highest Paying <span className="ml-1.5">💰</span>
        </Button>
      </div>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}
