import { useEffect, useRef } from "react";

const recentTasks = [
  "Lab help done in Block B",
  "Notes delivered to Library",
  "Photography session at Auditorium",
  "Tech support in Computer Lab",
  "Assignment help in Block A",
  "Delivery to Hostel Block C",
  "Styling session completed",
  "Moving help in Block D",
];

export default function WeeklyProgressReel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= scrollContainer.scrollHeight / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollTop = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-6 h-[500px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[oklch(0.8_0.25_150)] animate-pulse" />
        Weekly Progress
      </h2>
      <div ref={scrollRef} className="flex-1 overflow-hidden space-y-3">
        {/* Duplicate for seamless loop */}
        {[...recentTasks, ...recentTasks].map((task, index) => (
          <div
            key={`reel-${index}-${task.slice(0, 8)}`}
            className="backdrop-blur-sm bg-background/50 border border-border/50 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-[oklch(0.8_0.25_150)]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[oklch(0.8_0.25_150)] text-xl">✓</span>
            </div>
            <p className="text-sm">{task}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
