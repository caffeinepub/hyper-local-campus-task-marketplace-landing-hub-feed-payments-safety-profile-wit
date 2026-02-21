import { useState } from 'react';
import LandingView from './views/LandingView';
import HubView from './views/HubView';
import ProfileView from './views/ProfileView';
import { Toaster } from '@/components/ui/sonner';

export type View = 'landing' | 'hub' | 'profile';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Neon grid background */}
      <div 
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'url(/assets/generated/neon-grid-bg.dim_1920x1080.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {currentView === 'landing' && <LandingView onNavigate={setCurrentView} />}
        {currentView === 'hub' && <HubView onNavigate={setCurrentView} />}
        {currentView === 'profile' && <ProfileView onNavigate={setCurrentView} />}
      </div>

      <Toaster />
    </div>
  );
}

export default App;
