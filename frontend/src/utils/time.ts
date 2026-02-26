/**
 * Converts a datetime-local input string to a Time (bigint nanoseconds since epoch).
 * Returns null if the input is empty or invalid.
 */
export function datetimeLocalToTime(datetimeLocal: string): bigint | null {
  if (!datetimeLocal) return null;
  
  try {
    const date = new Date(datetimeLocal);
    if (isNaN(date.getTime())) return null;
    
    // Convert milliseconds to nanoseconds
    return BigInt(date.getTime()) * BigInt(1_000_000);
  } catch {
    return null;
  }
}

/**
 * Converts a Time (bigint nanoseconds) to a datetime-local input string.
 * Returns empty string if time is null/undefined.
 */
export function timeToDatetimeLocal(time: bigint | undefined): string {
  if (!time) return '';
  
  try {
    // Convert nanoseconds to milliseconds
    const ms = Number(time / BigInt(1_000_000));
    const date = new Date(ms);
    
    // Format as datetime-local (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Formats a Time (bigint nanoseconds) into a human-readable date + time string.
 * Returns null if time is null/undefined.
 */
export function formatDeadline(time: bigint | undefined): string | null {
  if (!time) return null;
  
  try {
    // Convert nanoseconds to milliseconds
    const ms = Number(time / BigInt(1_000_000));
    const date = new Date(ms);
    
    // Format using Intl.DateTimeFormat for locale-aware formatting
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return null;
  }
}
