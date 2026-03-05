import { useCallback, useEffect, useState } from "react";

interface GoogleAuthResponse {
  credential: string;
  select_by?: string;
}

interface DecodedToken {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

interface UseGoogleAuthReturn {
  isLoaded: boolean;
  signIn: () => Promise<string | null>;
  signOut: () => void;
  user: DecodedToken | null;
  error: string | null;
}

// Decode JWT token to extract user info
function decodeJWT(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) {
      console.error("Invalid JWT token format");
      return null;
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

// Google Client ID - using a demo client ID for testing
// In production, replace this with your actual Google Client ID
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com";

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if Google SDK is loaded and initialize
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const initializeGoogle = () => {
      if (typeof window === "undefined") return;

      const google = (window as any).google;

      if (google?.accounts?.id) {
        console.log("Google Identity Services SDK loaded successfully");
        setIsLoaded(true);
        setError(null);

        // Initialize Google Sign-In
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          setIsInitialized(true);
          console.log("Google Sign-In initialized");
        } catch (err) {
          console.error("Failed to initialize Google Sign-In:", err);
          setError("Failed to initialize Google Sign-In");
        }

        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    // Check immediately
    initializeGoogle();

    // If not loaded, check periodically
    if (!isLoaded) {
      checkInterval = setInterval(initializeGoogle, 100);

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        if (!isLoaded) {
          console.error(
            "Google Identity Services SDK failed to load within timeout",
          );
          setError("Failed to load Google Sign-In. Please refresh the page.");
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 10000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoaded]);

  const handleCredentialResponse = useCallback(
    (response: GoogleAuthResponse) => {
      console.log("Received credential response from Google");
      const decoded = decodeJWT(response.credential);
      if (decoded) {
        console.log("Successfully decoded user info:", decoded.email);
        setUser(decoded);
        setError(null);
      } else {
        console.error("Failed to decode credential");
        setError("Failed to decode user information");
      }
    },
    [],
  );

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!isLoaded || !isInitialized) {
      const errorMsg =
        "Google Sign-In not ready. Please wait or refresh the page.";
      console.error(errorMsg);
      setError(errorMsg);
      return null;
    }

    if (typeof window === "undefined") {
      setError("Window object not available");
      return null;
    }

    const google = (window as any).google;

    if (!google || !google.accounts || !google.accounts.id) {
      const errorMsg = "Google Sign-In SDK not available";
      console.error(errorMsg);
      setError(errorMsg);
      return null;
    }

    try {
      console.log("Triggering Google Sign-In prompt...");
      setError(null);

      // Return a promise that resolves when user signs in
      return new Promise((resolve) => {
        // Set up a one-time callback for this sign-in attempt
        const originalCallback = handleCredentialResponse;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: GoogleAuthResponse) => {
            originalCallback(response);
            const decoded = decodeJWT(response.credential);
            resolve(decoded?.email || null);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Show the One Tap prompt
        google.accounts.id.prompt((notification: any) => {
          console.log("Prompt notification:", notification);

          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.warn("Google Sign-In prompt not displayed:", reason);
            setError(`Sign-in not available: ${reason}`);
            resolve(null);
          } else if (notification.isSkippedMoment()) {
            const reason = notification.getSkippedReason();
            console.warn("Google Sign-In prompt skipped:", reason);
            setError("Sign-in was skipped or dismissed");
            resolve(null);
          } else if (notification.isDismissedMoment()) {
            const reason = notification.getDismissedReason();
            console.warn("Google Sign-In prompt dismissed:", reason);
            setError("Sign-in was dismissed");
            resolve(null);
          }
        });
      });
    } catch (err) {
      const errorMsg = "Failed to show Google Sign-In prompt";
      console.error(errorMsg, err);
      setError(errorMsg);
      return null;
    }
  }, [isLoaded, isInitialized, handleCredentialResponse]);

  const signOut = useCallback(() => {
    console.log("Signing out from Google");
    setUser(null);
    setError(null);
    if (typeof window !== "undefined" && (window as any).google) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (err) {
        console.error("Error during sign out:", err);
      }
    }
  }, []);

  return {
    isLoaded,
    signIn,
    signOut,
    user,
    error,
  };
}
