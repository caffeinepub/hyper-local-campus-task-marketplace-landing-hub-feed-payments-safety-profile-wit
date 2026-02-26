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
  const handleCategoryClick = (category: string) => {
    // Toggle: clicking the active category deselects it
    onSelectCategory(selectedCategory === category ? null : category);
  };

  return (
    <ScrollArea className="w-full scroll-smooth">
      <div className="flex gap-3 px-5 py-4">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(null)}
          className={
            selectedCategory === null
              ? 'bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black hover:opacity-90 shadow-glow-green font-semibold px-5 rounded-full transition-all'
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
            onClick={() => handleCategoryClick(category)}
            className={
              selectedCategory === category
                ? 'bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black hover:opacity-90 shadow-glow-green font-semibold px-5 rounded-full transition-all whitespace-nowrap'
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
