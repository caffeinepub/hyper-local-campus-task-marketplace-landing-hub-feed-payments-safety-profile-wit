import {
  findUserByEmail,
  saveUserToSheet,
  updateUserProfile,
} from "@/utils/sheetdb";
import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "proxiis_session";

export interface SheetSession {
  user_id: string;
  name: string;
  email: string;
  profile_complete?: boolean;
  full_name?: string;
  phone_number?: string;
  student_id?: string;
  upi_id?: string;
}

interface UseSheetAuthReturn {
  currentUser: SheetSession | null;
  isLoading: boolean;
  loginWithGoogle: (email: string, name: string) => Promise<void>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
  saveProfileDetails: (
    user_id: string,
    full_name: string,
    phone_number: string,
    student_id: string,
    upi_id: string,
  ) => Promise<void>;
}

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function persistSession(session: SheetSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function readSession(): SheetSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user_id && parsed?.email) return parsed as SheetSession;
    return null;
  } catch {
    return null;
  }
}

export function useSheetAuth(): UseSheetAuthReturn {
  const [currentUser, setCurrentUser] = useState<SheetSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const session = readSession();
    if (session) setCurrentUser(session);
  }, []);

  const loginWithGoogle = useCallback(
    async (email: string, name: string): Promise<void> => {
      setIsLoading(true);
      try {
        let user = await findUserByEmail(email);
        let isNewUser = false;

        if (!user) {
          // New Google user — create an account
          const user_id = crypto.randomUUID();
          await saveUserToSheet(user_id, name, email);
          user = { user_id, name, email };
          isNewUser = true;
        }

        const session: SheetSession = {
          user_id: user.user_id,
          name: user.name || name,
          email: user.email,
          profile_complete: isNewUser
            ? false
            : !!(user.full_name && user.phone_number),
          full_name: user.full_name,
          phone_number: user.phone_number,
          student_id: user.student_id,
          upi_id: user.upi_id,
        };
        persistSession(session);
        setCurrentUser(session);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      setIsLoading(true);
      try {
        const existing = await findUserByEmail(email);
        if (existing) {
          throw new Error(
            "An account with this email already exists. Please log in.",
          );
        }

        const password_hash = await hashPassword(password);
        const user_id = crypto.randomUUID();
        await saveUserToSheet(user_id, name, email, password_hash);

        const session: SheetSession = {
          user_id,
          name,
          email,
          profile_complete: false,
        };
        persistSession(session);
        setCurrentUser(session);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      try {
        const user = await findUserByEmail(email);
        if (!user) {
          throw new Error("No account found with this email. Please sign up.");
        }
        if (!user.password_hash) {
          throw new Error(
            "This account was created with Google. Please use Google Sign-In.",
          );
        }

        const inputHash = await hashPassword(password);
        if (inputHash !== user.password_hash) {
          throw new Error("Incorrect password. Please try again.");
        }

        const session: SheetSession = {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          profile_complete: true,
          full_name: user.full_name,
          phone_number: user.phone_number,
          student_id: user.student_id,
          upi_id: user.upi_id,
        };
        persistSession(session);
        setCurrentUser(session);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const saveProfileDetails = useCallback(
    async (
      user_id: string,
      full_name: string,
      phone_number: string,
      student_id: string,
      upi_id: string,
    ): Promise<void> => {
      await updateUserProfile(user_id, {
        full_name,
        phone_number,
        student_id,
        upi_id,
      });

      // Update session in state and localStorage
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updated: SheetSession = {
          ...prev,
          full_name,
          phone_number,
          student_id,
          upi_id,
          profile_complete: true,
        };
        persistSession(updated);
        return updated;
      });
    },
    [],
  );

  const logout = useCallback((): void => {
    clearSession();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    isLoading,
    loginWithGoogle,
    signUpWithEmail,
    loginWithEmail,
    logout,
    saveProfileDetails,
  };
}
