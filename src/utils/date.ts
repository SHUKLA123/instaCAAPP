/** All timestamps from the API are RFC3339 UTC strings. */
export type IsoDateString = string;

export function formatDateTime(iso: IsoDateString): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso: IsoDateString): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
}

export function formatTime(iso: IsoDateString): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {hour: 'numeric', minute: '2-digit'});
}

/** Seconds -> "mm:ss" or "h:mm:ss" for call/session timers. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = mins.toString().padStart(hrs > 0 ? 2 : 1, '0');
  const ss = secs.toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function minutesToLabel(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

export function relativeCountdown(expiresAtIso: IsoDateString, nowMs: number): number {
  const expires = new Date(expiresAtIso).getTime();
  return Math.max(0, Math.ceil((expires - nowMs) / 1000));
}
