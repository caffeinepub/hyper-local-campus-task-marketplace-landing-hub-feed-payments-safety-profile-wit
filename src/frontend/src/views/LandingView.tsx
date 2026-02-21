import { Button } from '@/components/ui/button';
import WeeklyProgressReel from '@/components/WeeklyProgressReel';
import { Zap, Shield, CheckCircle } from 'lucide-react';
import type { View } from '../App';

interface LandingViewProps {
  onNavigate: (view: View) => void;
}

export default function LandingView({ onNavigate }: LandingViewProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
            PROXIIS
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Hero */}
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent">
                  Level Up Your Campus Life.
                </span>
                <br />
                <span className="text-foreground">Help. Earn. Repeat.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground">
                Connect with your campus community. Post tasks, earn money, and build your reputation.
              </p>

              <Button 
                size="lg"
                onClick={() => onNavigate('hub')}
                className="bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black font-semibold text-lg px-8 py-6 rounded-full shadow-lg shadow-[oklch(0.8_0.25_150)]/50"
              >
                Get Started
              </Button>

              {/* How it Works */}
              <div className="mt-12 space-y-4 backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">How it Works</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[oklch(0.8_0.25_150)]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[oklch(0.8_0.25_150)] font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Post</h3>
                      <p className="text-sm text-muted-foreground">Share your task with a photo and details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[oklch(0.7_0.2_270)]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[oklch(0.7_0.2_270)] font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Secure Pay</h3>
                      <p className="text-sm text-muted-foreground">Safe UPI payment with escrow protection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[oklch(0.8_0.25_150)]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[oklch(0.8_0.25_150)] font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Meet & Complete</h3>
                      <p className="text-sm text-muted-foreground">Connect safely and get it done</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Weekly Progress Reel */}
            <div className="order-first md:order-last">
              <WeeklyProgressReel />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} • Built with ❤️ using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[oklch(0.8_0.25_150)] hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
