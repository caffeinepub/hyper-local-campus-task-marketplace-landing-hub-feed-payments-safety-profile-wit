import {
  findUserByEmail,
  findUserByUsername,
  getUserById,
  saveUserToSheet,
  updateUserProfile,
  updateUsername,
} from "@/utils/sheetdb";
import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "proxiis_session";

export interface SheetSession {
  user_id: string;
  name: string;
  email: string;
  email_id?: string;
  profile_complete?: boolean;
  full_name?: string;
  phone_number?: string;
  upi_id?: string; // column D
  student_id?: string; // column F
  username?: string;
}

/** Returned by auth functions so callers can act immediately on profile completion status. */
export interface AuthResult {
  profile_complete: boolean;
}

interface UseSheetAuthReturn {
  currentUser: SheetSession | null;
  isLoading: boolean;
  isInitializing: boolean;
  loginWithGoogle: (email: string, name: string) => Promise<AuthResult>;
  /** username → user_id (col A). email → email_id (col E). password → pasword_hash (col H). */
  signUpWithEmail: (
    username: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  /** Login by username (user_id column) + password. */
  loginWithEmail: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  saveProfileDetails: (
    user_id: string,
    full_name: string,
    phone_number: string,
    email_id: string,
    student_id: string,
    upi_id: string,
  ) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  saveUsername: (user_id: string, username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function persistSession(session: SheetSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("proxiis_session_updated"));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function readSession(): SheetSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user_id) return parsed as SheetSession;
    return null;
  } catch {
    return null;
  }
}

/** Build a full session object from a SheetUser row. */
function buildSession(
  user: {
    user_id: string;
    full_name?: string;
    name?: string;
    email_id?: string;
    email?: string;
    phone_number?: string;
    upi_id?: string;
    student_id?: string;
    username?: string;
  },
  profile_complete: boolean,
): SheetSession {
  return {
    user_id: user.user_id,
    name: user.full_name || user.name || user.user_id,
    email: user.email_id || user.email || "",
    email_id: user.email_id || user.email || "",
    profile_complete,
    full_name: user.full_name || user.name || "",
    phone_number: user.phone_number || "",
    upi_id: user.upi_id || "",
    student_id: user.student_id || "",
    username: user.username || user.user_id,
  };
}

export function useSheetAuth(): UseSheetAuthReturn {
  const [currentUser, setCurrentUser] = useState<SheetSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (session) {
      setCurrentUser(session);
      getUserById(session.user_id)
        .then((freshUser) => {
          if (!freshUser) return;
          const profile_complete = !!(
            freshUser.full_name &&
            freshUser.phone_number &&
            freshUser.student_id &&
            freshUser.upi_id
          );
          const updated = buildSession(freshUser, profile_complete);
          if (session.profile_complete) updated.profile_complete = true;
          persistSession(updated);
          setCurrentUser(updated);
        })
        .catch(() => {})
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }

    const handleStorageChange = () => setCurrentUser(readSession());
    const handleSameTabUpdate = () => setCurrentUser(readSession());
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("proxiis_session_updated", handleSameTabUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "proxiis_session_updated",
        handleSameTabUpdate,
      );
    };
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    const session = readSession();
    if (!session?.user_id) return;
    const freshUser = await getUserById(session.user_id);
    if (!freshUser) return;
    const profile_complete = !!(
      freshUser.full_name &&
      freshUser.phone_number &&
      freshUser.student_id &&
      freshUser.upi_id
    );
    const updated = buildSession(
      freshUser,
      profile_complete || !!session.profile_complete,
    );
    persistSession(updated);
    setCurrentUser(updated);
  }, []);

  // ─── Google Sign-In ────────────────────────────────────────────────────────
  // Check by email_id (col E). If row exists → login to existing account.
  // If not → create a new row with a fresh UUID.
  const loginWithGoogle = useCallback(
    async (email: string, name: string): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        let existingUser = await findUserByEmail(email);
        let isNewUser = false;

        if (!existingUser) {
          const user_id = crypto.randomUUID();
          await saveUserToSheet(user_id, name, email);
          existingUser = {
            user_id,
            full_name: name,
            email_id: email,
            name,
            email,
          };
          isNewUser = true;
        }

        // Re-fetch to get all columns
        const freshUser = await getUserById(existingUser.user_id);
        const user = freshUser || existingUser;

        const profile_complete = isNewUser
          ? false
          : !!(
              user.full_name &&
              user.phone_number &&
              user.student_id &&
              user.upi_id
            );

        const session = buildSession(user, profile_complete);
        persistSession(session);
        setCurrentUser(session);
        return { profile_complete };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ─── Email/Password Sign-Up ────────────────────────────────────────────────
  // 1. Check if email_id (col E) already exists.
  //    YES → verify password against stored hash → log into existing account.
  //    NO  → check username uniqueness → create new row.
  const signUpWithEmail = useCallback(
    async (
      username: string,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase();

        // --- Step 1: Check if this Gmail already has an account (col E) ---
        const existingByEmail = await findUserByEmail(cleanEmail);
        if (existingByEmail) {
          // Account already exists — treat this as a login attempt
          if (!existingByEmail.pasword_hash) {
            // Account was created via Google Sign-In (no password)
            throw new Error(
              "This Gmail is linked to a Google account. Please use Google Sign-In.",
            );
          }
          const inputHash = await hashPassword(password);
          if (inputHash !== existingByEmail.pasword_hash) {
            throw new Error(
              "An account with this Gmail already exists. Incorrect password — please log in instead.",
            );
          }
          // Password matches → log into the existing account
          const freshUser = await getUserById(existingByEmail.user_id);
          const userRow = freshUser || existingByEmail;
          const profile_complete = !!(
            userRow.full_name &&
            userRow.phone_number &&
            userRow.student_id &&
            userRow.upi_id
          );
          const session = buildSession(userRow, profile_complete);
          persistSession(session);
          setCurrentUser(session);
          return { profile_complete };
        }

        // --- Step 2: New email — validate username ---
        if (cleanUsername.length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
        if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
          throw new Error(
            "Username can only contain letters, numbers, _ or -.",
          );
        }
        const existingByUsername = await findUserByUsername(cleanUsername);
        if (existingByUsername) {
          throw new Error(
            "That username is already taken. Please choose another.",
          );
        }

        // --- Step 3: Create the new account ---
        const password_hash = await hashPassword(password);
        await saveUserToSheet(
          cleanUsername,
          cleanUsername,
          cleanEmail,
          password_hash,
        );

        const session: SheetSession = {
          user_id: cleanUsername,
          name: cleanUsername,
          email: cleanEmail,
          email_id: cleanEmail,
          profile_complete: false,
          full_name: "",
          phone_number: "",
          upi_id: "",
          student_id: "",
          username: cleanUsername,
        };
        persistSession(session);
        setCurrentUser(session);
        return { profile_complete: false };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ─── Username/Password Login ───────────────────────────────────────────────
  const loginWithEmail = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        const cleanUsername = username.trim().toLowerCase();
        const user = await findUserByUsername(cleanUsername);
        if (!user) {
          throw new Error(
            "No account found with that username. Please sign up.",
          );
        }
        if (!user.pasword_hash) {
          throw new Error(
            "This account was created with Google. Please use Google Sign-In.",
          );
        }
        const inputHash = await hashPassword(password);
        if (inputHash !== user.pasword_hash) {
          throw new Error("Incorrect password. Please try again.");
        }

        const freshUser = await getUserById(cleanUsername);
        const userRow = freshUser || user;
        const profile_complete = !!(
          userRow.full_name &&
          userRow.phone_number &&
          userRow.student_id &&
          userRow.upi_id
        );

        const session = buildSession(userRow, profile_complete);
        persistSession(session);
        setCurrentUser(session);
        return { profile_complete };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ─── Profile save — always patches by user_id (col A) ─────────────────────
  const saveProfileDetails = useCallback(
    async (
      user_id: string,
      full_name: string,
      phone_number: string,
      email_id: string,
      student_id: string,
      upi_id: string,
    ): Promise<void> => {
      await updateUserProfile(user_id, {
        full_name,
        phone_number,
        upi_id,
        email_id,
        student_id,
      });

      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updated: SheetSession = {
          ...prev,
          full_name,
          name: full_name,
          phone_number,
          email: email_id,
          email_id,
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

  const checkUsernameAvailable = useCallback(
    async (handle: string): Promise<boolean> => {
      if (!handle.trim()) return false;
      const normalised = handle.trim().toLowerCase();
      const existing = await findUserByUsername(normalised);
      if (!existing) return true;
      const session = readSession();
      return existing.user_id === session?.user_id;
    },
    [],
  );

  const saveUsername = useCallback(
    async (user_id: string, new_handle: string): Promise<void> => {
      const normalised = new_handle.trim().toLowerCase();
      await updateUsername(user_id, normalised);
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updated: SheetSession = {
          ...prev,
          user_id: normalised,
          username: normalised,
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
    isInitializing,
    loginWithGoogle,
    signUpWithEmail,
    loginWithEmail,
    logout,
    saveProfileDetails,
    checkUsernameAvailable,
    saveUsername,
    refreshProfile,
  };
}
