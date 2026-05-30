import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(date: Date | string, fmt: string = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'dd MMM yyyy HH:mm');
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatTime(date: Date | string): string {
  return formatDate(date, 'HH:mm');
}
