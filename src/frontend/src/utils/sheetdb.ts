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
 */
export async function saveUserToSheet(
  user_id: string,
  name: string,
  email: string,
  password_hash?: string,
): Promise<void> {
  const record: Record<string, string> = {
    user_id,
    full_name: name,
    email_id: email,
  };
  if (password_hash) {
    record.pasword_hash = password_hash;
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
  if (!Array.isArray(data) || data.length === 0) return null;
  return rowToSheetUser(data[0]);
}

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
    return null;
  }
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return rowToSheetUser(data[0]);
}

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

export async function updateUserProfile(
  user_id: string,
  data: {
    full_name?: string;
    phone_number?: string;
    upi_id?: string;
    email_id?: string;
    student_id?: string;
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
      return;
    }
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Failed to update user profile: ${response.status} – ${errorText}`,
    );
  }
}

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
  return rowToSheetUser(data[0]);
}

// ─── Task sheet helpers ────────────────────────────────────────────────────
//
// task sheet column mapping:
//   A: task_photo | B: task_id | D: user_id_originator | F: task_name
//   G: price | H: status | J: location | K: description

const TASK_SHEET_POST = `${SHEETDB_BASE}?sheet=task`;
const TASK_SHEET_SEARCH = `${SHEETDB_BASE}/search?sheet=task`;

export interface SheetTask {
  task_photo?: string; // col A
  task_id: string; // col B
  user_id_originator: string; // col D
  task_name: string; // col F
  price: string; // col G
  status?: string; // col H
  location: string; // col J
  description?: string; // col K
  date_posted?: string; // extra metadata
  deadline?: string; // deadline date string (YYYY-MM-DD)
  category?: string; // task category
}

/** Save a new task row to the task sheet. */
export async function saveTaskToSheet(task: SheetTask): Promise<void> {
  const response = await fetch(TASK_SHEET_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [task] }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(`Failed to save task: ${response.status} – ${errorText}`);
  }
}

/** Fetch ALL tasks from the task sheet (for the hub feed). */
export async function getAllSheetTasks(): Promise<SheetTask[]> {
  const url = `${SHEETDB_BASE}?sheet=task`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as SheetTask[]) : [];
}

/** Delete a task row by task_id from the task sheet. */
export async function deleteTaskFromSheet(task_id: string): Promise<void> {
  const url = `${SHEETDB_BASE}/task_id/${encodeURIComponent(task_id)}?sheet=task`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok && response.status !== 404) {
    console.warn(
      `deleteTaskFromSheet: status ${response.status} for task_id=${task_id}`,
    );
  }
}

/** Fetch a task row by task_id from the task sheet. Returns null if not found. */
export async function getSheetTaskById(
  task_id: string,
): Promise<SheetTask | null> {
  const url = `${TASK_SHEET_SEARCH}&task_id=${encodeURIComponent(task_id)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0] as SheetTask;
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

// ─── post_history (v2) helpers ───────────────────────────────────────────────
//
// post_history columns: user_id | task_id | task_name | date_posted | date_finished
// (date_finished = col E, status derived from task sheet col H)

const POST_HISTORY_POST_V2 = `${SHEETDB_BASE}?sheet=post_history`;
const POST_HISTORY_SEARCH_V2 = `${SHEETDB_BASE}/search?sheet=post_history`;

export interface PostHistoryRow2 {
  user_id: string;
  task_id: string;
  task_name?: string;
  date_posted?: string; // col D (when the task was posted)
  date_finished?: string; // col E
  completion_date?: string; // alias for date_finished
  [key: string]: string | undefined;
}

/** Create a post_history record when a new task is posted. */
export async function createPostHistoryRecord(
  user_id: string,
  task_id: string,
  task_name: string,
  date_posted: string,
): Promise<void> {
  const record = {
    user_id,
    task_id,
    task_name,
    date_posted,
    date_finished: "pending",
  };
  await fetch(POST_HISTORY_POST_V2, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [record] }),
  });
}

/** Delete all post_history rows matching task_id. */
export async function deletePostHistoryByTaskId(
  task_id: string,
): Promise<void> {
  const url = `${SHEETDB_BASE}/task_id/${encodeURIComponent(task_id)}?sheet=post_history`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok && response.status !== 404) {
    console.warn(
      `deletePostHistoryByTaskId: status ${response.status} for task_id=${task_id}`,
    );
  }
}

/** Delete all task_history rows matching task_id. */
export async function deleteTaskHistoryByTaskId(
  task_id: string,
): Promise<void> {
  const url = `${SHEETDB_BASE}/task_id/${encodeURIComponent(task_id)}?sheet=task_history`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok && response.status !== 404) {
    console.warn(
      `deleteTaskHistoryByTaskId: status ${response.status} for task_id=${task_id}`,
    );
  }
}

export async function getPostHistory2(
  user_id: string,
): Promise<PostHistoryRow2[]> {
  const url = `${POST_HISTORY_SEARCH_V2}&user_id=${encodeURIComponent(user_id)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ─── Task / History Stats (for Profile Dashboard) ─────────────────────────

const TASK_HISTORY_SEARCH = `${SHEETDB_BASE}/search?sheet=task_history`;
const TASK_SEARCH_GENERAL = `${SHEETDB_BASE}/search?sheet=task`;

export interface TaskHistoryRow {
  user_id: string;
  task_id: string;
  rating_score?: string;
  amount_earned?: string;
  originator?: string;
  completion_date?: string; // col E of task_history
  [key: string]: string | undefined;
}

export interface TaskRow {
  task_id: string;
  task_name?: string;
  originator?: string;
  status?: string; // col H
  [key: string]: string | undefined;
}

export async function getTaskHistory(
  user_id: string,
): Promise<TaskHistoryRow[]> {
  const url = `${TASK_HISTORY_SEARCH}&user_id=${encodeURIComponent(user_id)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getTaskById(task_id: string): Promise<TaskRow | null> {
  const url = `${TASK_SEARCH_GENERAL}&task_id=${encodeURIComponent(task_id)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0] as TaskRow;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function rowToSheetUser(row: Record<string, string>): SheetUser {
  const email_id = row.email_id ?? row.email ?? "";
  const full_name = row.full_name ?? row.name ?? "";
  const pasword_hash = row.pasword_hash ?? row.password_hash ?? undefined;
  return {
    user_id: row.user_id ?? "",
    full_name,
    email_id,
    phone_number: row.phone_number || undefined,
    upi_id: row.upi_id || undefined,
    student_id: row.student_id || undefined,
    pasword_hash,
    name: full_name,
    email: email_id,
    username: row.username || undefined,
  };
}
