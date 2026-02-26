import { useState, createContext, useContext, useCallback } from 'react';
import LandingView from './views/LandingView';
import HubView from './views/HubView';
import ProfileView from './views/ProfileView';
import { Toaster } from '@/components/ui/sonner';
import AuthPromptBar from './components/AuthPromptBar';
import { useInternetIdentity } from './hooks/useInternetIdentity';

export type View = 'landing' | 'hub' | 'profile';

// Context for triggering the auth prompt bar from anywhere
interface AuthPromptContextValue {
  showAuthPrompt: () => void;
}

export const AuthPromptContext = createContext<AuthPromptContextValue>({
  showAuthPrompt: () => {},
});

export function useAuthPrompt() {
  return useContext(AuthPromptContext);
}

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  // authBarVisible: whether the bar is currently shown
  // authBarDismissed: whether the user explicitly dismissed it in this session
  const [authBarVisible, setAuthBarVisible] = useState(false);
  const [authBarDismissed, setAuthBarDismissed] = useState(false);
  const { identity } = useInternetIdentity();

  // Auto-hide bar when user logs in
  const isAuthenticated = !!identity;
  if (isAuthenticated && authBarVisible) {
    setAuthBarVisible(false);
    setAuthBarDismissed(false);
  }

  // showAuthPrompt always resets dismissed state so a fresh prompt is shown
  const showAuthPrompt = useCallback(() => {
    setAuthBarDismissed(false);
    setAuthBarVisible(true);
  }, []);

  const handleDismiss = () => {
    setAuthBarDismissed(true);
    setAuthBarVisible(false);
  };

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt }}>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Neon grid background */}
        <div
          className="fixed inset-0 z-0 opacity-20"
          style={{
            backgroundImage: 'url(/assets/generated/neon-grid-bg.dim_1920x1080.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {currentView === 'landing' && <LandingView onNavigate={setCurrentView} />}
          {currentView === 'hub' && <HubView onNavigate={setCurrentView} />}
          {currentView === 'profile' && <ProfileView onNavigate={setCurrentView} />}
        </div>

        {/* Global auth prompt bar */}
        <AuthPromptBar
          visible={authBarVisible}
          onDismiss={handleDismiss}
        />

        <Toaster />
      </div>
    </AuthPromptContext.Provider>
  );
}

export default App;
