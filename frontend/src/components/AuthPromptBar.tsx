import { useState, useEffect } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { X, LogIn } from 'lucide-react';

interface AuthPromptBarProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function AuthPromptBar({ visible, onDismiss }: AuthPromptBarProps) {
  const { login, loginStatus } = useInternetIdentity();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="auth-prompt-bar max-w-2xl mx-auto rounded-xl border border-primary/40 bg-card/90 backdrop-blur-xl shadow-glow-coral px-4 py-3 flex items-center gap-3">
        {/* Flickering indicator dot */}
        <span className="auth-flicker-dot shrink-0 w-2.5 h-2.5 rounded-full bg-primary" />

        {/* Message */}
        <p className="flex-1 text-sm font-semibold text-foreground">
          <span className="text-primary">Login required</span>
          <span className="text-muted-foreground font-normal"> — sign in to interact with tasks</span>
        </p>

        {/* Login button */}
        <button
          onClick={() => login()}
          disabled={isLoggingIn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
        >
          <LogIn className="w-3.5 h-3.5" />
          {isLoggingIn ? 'Signing in…' : 'Sign in'}
        </button>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
