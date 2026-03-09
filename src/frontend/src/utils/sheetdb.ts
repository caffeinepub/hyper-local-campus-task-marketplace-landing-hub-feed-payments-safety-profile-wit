// SheetDB API helper for PROXIIS authentication
// Base URL: https://sheetdb.io/api/v1/xslj9jybiwh8t
//
// Sheet column mapping (users tab):
//   A: user_id | B: full_name | C: phone_number | D: upi_id
//   E: email_id | F: student_id | H: pasword_hash  (note: one 's' - matches sheet header exactly)

const SHEETDB_BASE = "https://sheetdb.io/api/v1/xslj9jybiwh8t";
const USERS_SHEET_POST = `${SHEETDB_BASE}?sheet=users`;
const USERS_SHEET_SEARCH = `${SHEETDB_BASE}/search?sheet=users`;

export interface SheetUser {
  user_id: string;
  full_name: string;
  phone_number?: string;
  upi_id?: string; // column D
  email_id: string; // column E
  student_id?: string; // column F
  pasword_hash?: string; // column H (single 's' — matches sheet header exactly)
  // Kept for backwards-compat within the session layer
  name?: string;
  email?: string;
  username?: string;
}

/**
 * Save a user record to the users sheet.
 * Column order: A=user_id, B=full_name, C=phone_number, D=upi_id, E=email_id, F=student_id, H=pasword_hash
 * - user_id (A): the chosen username for email sign-ups, or a UUID for Google sign-ins
 * - email_id (E): the user's gmail address
 * - pasword_hash (H): SHA-256 hash of the password (email sign-ups only)
 * Omits pasword_hash if not provided (Google sign-in users).
 */
export async function saveUserToSheet(
  user_id: string,
  name: string,
  email: string,
  password_hash?: string,
): Promise<void> {
  const record: Record<string, string> = {
    user_id, // column A — username chosen by user (email sign-up) or UUID (Google)
    full_name: name, // column B
    email_id: email, // column E
  };
  if (password_hash) {
    record.pasword_hash = password_hash; // column H — single 's' matches sheet header
  }

  const response = await fetch(USERS_SHEET_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [record] }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(`Failed to save user: ${response.status} – ${errorText}`);
  }
}

/**
 * Find a user by email_id (column E) in the users sheet.
 * Returns null if not found or on network failure.
 */
export async function findUserByEmail(
  email: string,
): Promise<SheetUser | null> {
  const url = `${USERS_SHEET_SEARCH}&email_id=${encodeURIComponent(email)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(`Failed to find user: ${response.status} – ${errorText}`);
  }

  const data = await response.json();

  // SheetDB returns an array; empty array means not found
  if (!Array.isArray(data) || data.length === 0) return null;

  const row = data[0];
  return rowToSheetUser(row);
}

/**
 * Find a user by user_id (used for availability checks when editing the handle).
 * Returns null if not found.
 */
export async function findUserByUsername(
  user_id_value: string,
): Promise<SheetUser | null> {
  const url = `${USERS_SHEET_SEARCH}&user_id=${encodeURIComponent(user_id_value.toLowerCase())}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    return null; // treat errors as "not found" for availability checks
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const row = data[0];
  return rowToSheetUser(row);
}

/**
 * PATCH user_id (the handle) for a specific row identified by the current user_id value.
 * SheetDB URL format: /user_id/<current_value>?sheet=users
 * The body overwrites the user_id column with the new handle.
 */
export async function updateUsername(
  current_user_id: string,
  new_user_id: string,
): Promise<void> {
  const url = `${SHEETDB_BASE}/user_id/${encodeURIComponent(current_user_id)}?sheet=users`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { user_id: new_user_id.toLowerCase() } }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Failed to update user ID: ${response.status} – ${errorText}`,
    );
  }
}

/**
 * PATCH user profile fields by user_id.
 * Maps to sheet columns:
 *   B=full_name, C=phone_number, D=upi_id, E=email_id, F=student_id
 * A 404 is treated as a warning (row not yet written) rather than a fatal error.
 */
export async function updateUserProfile(
  user_id: string,
  data: {
    full_name?: string;
    phone_number?: string;
    upi_id?: string; // column D
    email_id?: string; // column E
    student_id?: string; // column F
  },
): Promise<void> {
  const url = `${SHEETDB_BASE}/user_id/${encodeURIComponent(user_id)}?sheet=users`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(
        `updateUserProfile: row not found for user_id=${user_id}. Profile may not be saved to sheet.`,
      );
      return; // Don't throw — let the UI proceed
    }
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Failed to update user profile: ${response.status} – ${errorText}`,
    );
  }
}

/**
 * Fetch a user row by user_id.
 * Returns null if not found.
 */
export async function getUserById(user_id: string): Promise<SheetUser | null> {
  const url = `${USERS_SHEET_SEARCH}&user_id=${encodeURIComponent(user_id)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(`Failed to fetch user: ${response.status} – ${errorText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const row = data[0];
  return rowToSheetUser(row);
}

// ─── History sheet helpers ───────────────────────────────────────────────────

export interface PerformerHistoryRow {
  user_id: string;
  task_id: string;
  amount: string;
  date: string;
}

export interface PosterHistoryRow {
  user_id: string;
  task_id: string;
  amount_paid: string;
  performer_name: string;
}

const PERFORMER_HISTORY_POST = `${SHEETDB_BASE}?sheet=performer_history`;
const POSTER_HISTORY_POST = `${SHEETDB_BASE}?sheet=poster_history`;
const PERFORMER_HISTORY_SEARCH = `${SHEETDB_BASE}/search?sheet=performer_history`;
const POSTER_HISTORY_SEARCH = `${SHEETDB_BASE}/search?sheet=poster_history`;

export async function logPerformerHistory(
  user_id: string,
  task_id: string,
  amount: string,
  date: string,
): Promise<void> {
  await fetch(PERFORMER_HISTORY_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{ user_id, task_id, amount, date }] }),
  });
}

export async function logPosterHistory(
  user_id: string,
  task_id: string,
  amount_paid: string,
  performer_name: string,
): Promise<void> {
  await fetch(POSTER_HISTORY_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{ user_id, task_id, amount_paid, performer_name }],
    }),
  });
}

export async function getPerformerHistory(
  user_id: string,
): Promise<PerformerHistoryRow[]> {
  const url = `${PERFORMER_HISTORY_SEARCH}&user_id=${encodeURIComponent(user_id)}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data as PerformerHistoryRow[];
}

export async function getPosterHistory(
  user_id: string,
): Promise<PosterHistoryRow[]> {
  const url = `${POSTER_HISTORY_SEARCH}&user_id=${encodeURIComponent(user_id)}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data as PosterHistoryRow[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Normalise a raw SheetDB row to SheetUser, handling both old and new column names. */
function rowToSheetUser(row: Record<string, string>): SheetUser {
  // email_id is column E; fall back to legacy 'email' if present
  const email_id = row.email_id ?? row.email ?? "";
  // full_name is column B; fall back to legacy 'name'
  const full_name = row.full_name ?? row.name ?? "";
  // pasword_hash is column H (single 's'); fall back to legacy double-s spelling
  const pasword_hash = row.pasword_hash ?? row.password_hash ?? undefined;

  return {
    user_id: row.user_id ?? "",
    full_name,
    email_id,
    phone_number: row.phone_number || undefined,
    upi_id: row.upi_id || undefined, // column D
    student_id: row.student_id || undefined, // column F
    pasword_hash,
    // Keep aliases for compatibility with session layer
    name: full_name,
    email: email_id,
    username: row.username || undefined,
  };
}
