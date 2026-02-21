import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CATEGORIES = [
  'Assignments',
  'Deliveries',
  'Rentals',
  'Tech Support',
  'Styling',
  'Photography',
  'Notes',
  'Moving'
];

interface CategorySelectorProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  return (
    <ScrollArea className="w-full scroll-smooth">
      <div className="flex gap-3 px-5 py-4">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(null)}
          className={
            selectedCategory === null 
              ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-glow-coral font-semibold px-5 rounded-full transition-all' 
              : 'backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-primary/40 rounded-full transition-all'
          }
        >
          All
        </Button>
        {CATEGORIES.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory(category)}
            className={
              selectedCategory === category 
                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-glow-coral font-semibold px-5 rounded-full transition-all whitespace-nowrap' 
                : 'backdrop-blur-xl bg-background/50 border-border/60 hover:bg-muted/50 hover:border-primary/40 rounded-full transition-all whitespace-nowrap'
            }
          >
            {category}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}
