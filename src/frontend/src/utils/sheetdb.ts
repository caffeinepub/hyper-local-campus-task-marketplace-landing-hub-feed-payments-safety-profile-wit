// SheetDB API helper for PROXIIS authentication
// Base URL: https://sheetdb.io/api/v1/xslj9jybiwh8t

const SHEETDB_BASE = "https://sheetdb.io/api/v1/xslj9jybiwh8t";
const USERS_SHEET_POST = `${SHEETDB_BASE}?sheet=users`;
const USERS_SHEET_SEARCH = `${SHEETDB_BASE}/search?sheet=users`;

export interface SheetUser {
  user_id: string;
  name: string;
  email: string;
  password_hash?: string;
  full_name?: string;
  phone_number?: string;
  student_id?: string;
  upi_id?: string;
  username?: string;
}

/**
 * Save a user record to the users sheet.
 * Omits password_hash if not provided (Google sign-in users).
 */
export async function saveUserToSheet(
  user_id: string,
  name: string,
  email: string,
  password_hash?: string,
): Promise<void> {
  const record: Record<string, string> = { user_id, name, email };
  if (password_hash) {
    record.password_hash = password_hash;
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
 * Find a user by email in the users sheet.
 * Returns null if not found or on network failure.
 */
export async function findUserByEmail(
  email: string,
): Promise<SheetUser | null> {
  const url = `${USERS_SHEET_SEARCH}&email=${encodeURIComponent(email)}`;

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
  return {
    user_id: row.user_id ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    password_hash: row.password_hash ?? undefined,
    full_name: row.full_name || undefined,
    phone_number: row.phone_number || undefined,
    student_id: row.student_id || undefined,
    upi_id: row.upi_id || undefined,
    username: row.username || undefined,
  };
}

/**
 * Find a user by username (case-insensitive exact match).
 * Returns null if not found.
 */
export async function findUserByUsername(
  username: string,
): Promise<SheetUser | null> {
  const url = `${USERS_SHEET_SEARCH}&username=${encodeURIComponent(username.toLowerCase())}`;
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
  return {
    user_id: row.user_id ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    username: row.username || undefined,
  };
}

/**
 * PATCH username by user_id.
 */
export async function updateUsername(
  user_id: string,
  username: string,
): Promise<void> {
  const url = `${SHEETDB_BASE}/user_id/${encodeURIComponent(user_id)}?sheet=users`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { username: username.toLowerCase() } }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Failed to update username: ${response.status} – ${errorText}`,
    );
  }
}

/**
 * PATCH user profile fields by user_id.
 */
export async function updateUserProfile(
  user_id: string,
  data: {
    full_name?: string;
    phone_number?: string;
    student_id?: string;
    upi_id?: string;
  },
): Promise<void> {
  const url = `${SHEETDB_BASE}/user_id/${encodeURIComponent(user_id)}?sheet=users`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
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
  return {
    user_id: row.user_id ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    password_hash: row.password_hash ?? undefined,
    full_name: row.full_name || undefined,
    phone_number: row.phone_number || undefined,
    student_id: row.student_id || undefined,
    upi_id: row.upi_id || undefined,
    username: row.username || undefined,
  };
}
