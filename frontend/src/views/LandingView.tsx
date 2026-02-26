import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Share2, Users, Compass, MessageCircle, Shield, TrendingUp } from 'lucide-react';
import type { View } from '../App';

interface LandingViewProps {
  onNavigate: (view: View) => void;
}

export default function LandingView({ onNavigate }: LandingViewProps) {
  const heroAnimation = useScrollAnimation({ threshold: 0.2 });
  const featuresAnimation = useScrollAnimation({ threshold: 0.15 });
  const socialProofAnimation = useScrollAnimation({ threshold: 0.15 });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            PROXIIS
          </h1>
          <Button 
            variant="outline"
            onClick={() => onNavigate('hub')}
            className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-6 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/assets/generated/hero-background.dim_1920x1080.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        <div 
          ref={heroAnimation.ref}
          className={`max-w-5xl mx-auto text-center relative z-10 transition-all duration-1000 ${
            heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Your Campus,
            </span>
            <br />
            <span className="text-foreground">Your Community</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Connect with peers, share tasks, and build meaningful relationships. 
            PROXIIS transforms how students collaborate and earn on campus.
          </p>

          <Button 
            size="lg"
            onClick={() => onNavigate('hub')}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background font-bold text-lg px-12 py-7 rounded-full shadow-glow-coral transition-all hover:scale-105"
          >
            Get Started Free
          </Button>

          <p className="text-sm text-muted-foreground mt-6">
            Join hundreds of students already earning and helping
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 bg-card/30">
        <div 
          ref={featuresAnimation.ref}
          className={`max-w-7xl mx-auto transition-all duration-1000 delay-200 ${
            featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-black mb-4">
              Everything You Need
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform designed for student collaboration and earning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Share */}
            <div className="group backdrop-blur-xl bg-card/50 border border-border rounded-3xl p-8 hover:border-primary/50 transition-all hover:shadow-glow-coral">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <img 
                  src="/assets/generated/icon-share.dim_256x256.png" 
                  alt="Share" 
                  className="w-10 h-10"
                />
              </div>
              <h4 className="text-2xl font-bold mb-3">Share Posts</h4>
              <p className="text-muted-foreground leading-relaxed">
                Create and share tasks with photos, descriptions, and pricing. 
                Your posts reach the right people instantly.
              </p>
            </div>

            {/* Feature 2: Connect */}
            <div className="group backdrop-blur-xl bg-card/50 border border-border rounded-3xl p-8 hover:border-secondary/50 transition-all hover:shadow-glow-teal">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <img 
                  src="/assets/generated/icon-connect.dim_256x256.png" 
                  alt="Connect" 
                  className="w-10 h-10"
                />
              </div>
              <h4 className="text-2xl font-bold mb-3">Build Connections</h4>
              <p className="text-muted-foreground leading-relaxed">
                Network with students across campus. Build trust through verified 
                interactions and grow your reputation.
              </p>
            </div>

            {/* Feature 3: Discover */}
            <div className="group backdrop-blur-xl bg-card/50 border border-border rounded-3xl p-8 hover:border-accent/50 transition-all hover:shadow-glow-amber">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <img 
                  src="/assets/generated/icon-discover.dim_256x256.png" 
                  alt="Discover" 
                  className="w-10 h-10"
                />
              </div>
              <h4 className="text-2xl font-bold mb-3">Discover Opportunities</h4>
              <p className="text-muted-foreground leading-relaxed">
                Browse trending tasks, filter by category, and find opportunities 
                that match your skills and schedule.
              </p>
            </div>

            {/* Feature 4: Engage */}
            <div className="group backdrop-blur-xl bg-card/50 border border-border rounded-3xl p-8 hover:border-primary/50 transition-all hover:shadow-glow-coral">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <img 
                  src="/assets/generated/icon-engage.dim_256x256.png" 
                  alt="Engage" 
                  className="w-10 h-10"
                />
              </div>
              <h4 className="text-2xl font-bold mb-3">Real-Time Engagement</h4>
              <p className="text-muted-foreground leading-relaxed">
                Chat via Telegram, coordinate meetups, and collaborate seamlessly. 
                Stay connected throughout the task lifecycle.
              </p>
            </div>

            {/* Feature 5: Security */}
            <div className="group backdrop-blur-xl bg-card/50 border border-border rounded-3xl p-8 hover:border-secondary/50 transition-all hover:shadow-glow-teal">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <img 
                  src="/assets/generated/icon-security.dim_256x256.png" 
                  alt="Security" 
                  className="w-10 h-10"
                />
              </div>
              <h4 className="text-2xl font-bold mb-3">Secure Payments</h4>
              <p className="text-muted-foreground leading-relaxed">
                Safe UPI transactions with escrow protection. Money is released 
                only after task verification and approval.
              </p>
            </div>

            {/* Feature 6: Earn */}
            <div className="group backdrop-blur-xl bg-card/50 border border-border rounded-3xl p-8 hover:border-accent/50 transition-all hover:shadow-glow-amber">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-10 h-10 text-accent" />
              </div>
              <h4 className="text-2xl font-bold mb-3">Track Your Growth</h4>
              <p className="text-muted-foreground leading-relaxed">
                Monitor your earnings, completed tasks, and ratings. Climb the 
                leaderboard and showcase your reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 md:px-6">
        <div 
          ref={socialProofAnimation.ref}
          className={`max-w-7xl mx-auto transition-all duration-1000 delay-300 ${
            socialProofAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-black mb-4">
              Growing Every Day
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real impact, real numbers from our campus community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Stat 1 */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 rounded-3xl p-10 text-center">
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                500+
              </div>
              <div className="text-xl font-semibold mb-2">Tasks Completed</div>
              <p className="text-muted-foreground">
                Students helping students get things done
              </p>
            </div>

            {/* Stat 2 */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/30 rounded-3xl p-10 text-center">
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-4">
                200+
              </div>
              <div className="text-xl font-semibold mb-2">Active Users</div>
              <p className="text-muted-foreground">
                Growing community of trusted peers
              </p>
            </div>

            {/* Stat 3 */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-accent/10 to-secondary/10 border border-accent/30 rounded-3xl p-10 text-center">
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent mb-4">
                ₹50K+
              </div>
              <div className="text-xl font-semibold mb-2">Total Earnings</div>
              <p className="text-muted-foreground">
                Money earned by students on campus
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Button 
              size="lg"
              onClick={() => onNavigate('hub')}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background font-bold text-lg px-12 py-7 rounded-full shadow-glow-coral transition-all hover:scale-105"
            >
              Join the Community
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 backdrop-blur-xl bg-card/30">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} PROXIIS • Built with ❤️ using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
