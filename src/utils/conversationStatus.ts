/**
 * CRM conversation/session status display.
 * - status === 'N/A' → render "N/A"
 * - status === 'active' | 'paused' | 'closed' → show same
 */

export function conversationStatusLabel(status: string | undefined): string {
  if (status == null || status === '') return '—';
  if (status.toUpperCase() === 'N/A') return 'N/A';
  return status;
}

/** Safe badge class for status: active, paused, closed, or default for N/A/unknown. */
export function conversationStatusBadgeClass(status: string | undefined): string {
  if (status == null || status === '') return 'default';
  const s = status.toUpperCase();
  if (s === 'N/A') return 'na';
  if (s === 'ACTIVE' || s === 'PAUSED' || s === 'CLOSED') return status.toLowerCase();
  return 'default';
}
