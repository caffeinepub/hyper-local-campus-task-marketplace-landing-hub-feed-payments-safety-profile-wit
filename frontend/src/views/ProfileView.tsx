import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StarRating from '@/components/StarRating';
import { useGetCallerProfile, useGetCallerUserProfile, useCreateUserProfileWithGoogle, useSaveCallerUserProfile } from '@/hooks/useProfile';
import { useUserPostHistory } from '@/hooks/useTasks';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Skeleton } from '@/components/ui/skeleton';
import TaskCard from '@/components/TaskCard';
import { Trophy, DollarSign, CheckCircle, LogIn, Mail, Lock, Loader2, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { toast } from 'sonner';
import type { View } from '../App';

interface ProfileViewProps {
  onNavigate: (view: View) => void;
}

export default function ProfileView({ onNavigate }: ProfileViewProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerProfile();
  const { data: userProfile, isLoading: userProfileLoading, isFetched } = useGetCallerUserProfile();
  const createProfileWithGoogle = useCreateUserProfileWithGoogle();
  const saveProfile = useSaveCallerUserProfile();
  const { signIn, user: googleUser, error: googleError, isLoaded: googleLoaded } = useGoogleAuth();

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [manualGmail, setManualGmail] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal() || null;
  
  // Fetch user's post history
  const { data: postHistory, isLoading: postHistoryLoading } = useUserPostHistory(userPrincipal);

  const averageRating = profile && profile.ratingCount > 0n
    ? Number(profile.ratingSum) / Number(profile.ratingCount)
    : 0;

  // Check if profile setup is needed
  useEffect(() => {
    if (isAuthenticated && !userProfileLoading && isFetched && userProfile === null) {
      setShowProfileSetup(true);
    }
  }, [isAuthenticated, userProfileLoading, isFetched, userProfile]);

  // Handle Google sign-in success
  useEffect(() => {
    if (googleUser && isAuthenticated && !userProfile) {
      setProfileName(googleUser.name || '');
      setIsSigningInWithGoogle(false);
      toast.success(`Welcome, ${googleUser.name}! Your Gmail has been connected.`);
    }
  }, [googleUser, isAuthenticated, userProfile]);

  // Show Google error
  useEffect(() => {
    if (googleError) {
      setIsSigningInWithGoogle(false);
      toast.error(googleError);
    }
  }, [googleError]);

  const handleGoogleSignIn = async () => {
    if (!isAuthenticated) {
      toast.error('Please login with Internet Identity first');
      return;
    }

    if (!googleLoaded) {
      toast.error('Google Sign-In is still loading. Please wait a moment.');
      return;
    }

    setIsSigningInWithGoogle(true);
    
    try {
      console.log('Starting Google Sign-In...');
      const email = await signIn();
      
      if (email) {
        console.log('Google Sign-In successful, email:', email);
        toast.success('Successfully signed in with Google!');
      } else {
        console.log('Google Sign-In returned no email');
        setIsSigningInWithGoogle(false);
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      setIsSigningInWithGoogle(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsCreatingProfile(true);

    try {
      if (googleUser?.email) {
        // Create profile with Google email
        await createProfileWithGoogle.mutateAsync({
          name: profileName.trim(),
          gmailAddress: googleUser.email,
        });
        toast.success('Profile created successfully with Google account!');
      } else if (manualGmail.trim()) {
        // Create profile with manual email
        await saveProfile.mutateAsync({
          name: profileName.trim(),
          gmailAddress: manualGmail.trim(),
          postHistory: [],
        });
        toast.success('Profile created successfully!');
      } else {
        // Create profile without email
        await saveProfile.mutateAsync({
          name: profileName.trim(),
          gmailAddress: undefined,
          postHistory: [],
        });
        toast.success('Profile created successfully!');
      }
      setShowProfileSetup(false);
      setProfileName('');
      setManualGmail('');
    } catch (error: any) {
      console.error('Failed to create profile:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="backdrop-blur-xl bg-card/30 border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('hub')}
              className="hover:bg-[oklch(0.8_0.25_150)]/20 hover:text-[oklch(0.8_0.25_150)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          {isAuthenticated ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clear}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Logout
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              className="bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {!isAuthenticated ? (
          <Card className="backdrop-blur-xl bg-card/30 border-border">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[oklch(0.8_0.25_150)]/20 flex items-center justify-center mx-auto">
                <LogIn className="w-8 h-8 text-[oklch(0.8_0.25_150)]" />
              </div>
              <h2 className="text-xl font-semibold">Login to View Your Profile</h2>
              <p className="text-muted-foreground">
                Connect with Internet Identity to track your tasks, earnings, and reputation.
              </p>
              <Button 
                onClick={login}
                disabled={isLoggingIn}
                className="bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black"
              >
                {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
              </Button>
            </CardContent>
          </Card>
        ) : isLoading || userProfileLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Personal Information Section - Only visible to profile owner */}
            {userProfile && (
              <Card className="backdrop-blur-xl bg-card/30 border-border border-[oklch(0.7_0.2_270)]/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[oklch(0.7_0.2_270)]" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Gmail Address</p>
                      <p className="text-base font-medium break-all">
                        {userProfile.gmailAddress || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      This information is private and only visible to you
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <Card className="backdrop-blur-xl bg-card/30 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[oklch(0.8_0.25_150)]" />
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{profile?.tasksCompleted.toString() || '0'}</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-card/30 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[oklch(0.7_0.2_270)]" />
                  User Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <StarRating rating={averageRating} />
                  <span className="text-2xl font-bold">
                    {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                {profile && profile.ratingCount > 0n && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {profile.ratingCount.toString()} rating{profile.ratingCount > 1n ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-card/30 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[oklch(0.8_0.25_150)]" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">₹{profile?.earnings.toString() || '0'}</p>
              </CardContent>
            </Card>

            {/* My Posts Section */}
            <Card className="backdrop-blur-xl bg-card/30 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[oklch(0.8_0.25_150)]" />
                  My Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postHistoryLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                  </div>
                ) : postHistory && postHistory.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {postHistory.map((task) => (
                      <TaskCard key={task.id.toString()} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-muted-foreground">You haven't created any posts yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start by creating your first task in the Hub
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="backdrop-blur-xl bg-card/30 border-border border-[oklch(0.8_0.25_150)]/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Complete more tasks to increase your earnings and build your reputation on campus!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Profile Setup Dialog */}
      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Let's set up your profile to get started with PROXIIS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                disabled={isCreatingProfile || isSigningInWithGoogle}
              />
            </div>

            {!googleUser && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Sign in with Google
                    </span>
                  </div>
                </div>

                {!googleLoaded && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading Google Sign-In...</span>
                  </div>
                )}

                {googleError && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{googleError}</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isCreatingProfile || isSigningInWithGoogle || !googleLoaded}
                >
                  {isSigningInWithGoogle ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <SiGoogle className="w-4 h-4 mr-2" />
                      Sign in with Google
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or enter manually
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmail">Gmail Address (Optional)</Label>
                  <Input
                    id="gmail"
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={manualGmail}
                    onChange={(e) => setManualGmail(e.target.value)}
                    disabled={isCreatingProfile || isSigningInWithGoogle}
                  />
                </div>
              </>
            )}

            {googleUser && (
              <div className="rounded-lg border border-[oklch(0.8_0.25_150)]/30 bg-[oklch(0.8_0.25_150)]/10 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <SiGoogle className="w-4 h-4 text-[oklch(0.8_0.25_150)]" />
                  <span className="font-medium">Google Account Connected</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 break-all">
                  {googleUser.email}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateProfile}
              disabled={isCreatingProfile || isSigningInWithGoogle || !profileName.trim()}
              className="w-full bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black"
            >
              {isCreatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Create Profile'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
