import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';

export function getDateKey(dateStr: string) {
    return format(new Date(dateStr), 'yyyy-MM-dd');
}

export function formatTime(dateStr: string) {
    return format(new Date(dateStr), 'h:mm a');
}

export function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);

    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    if (differenceInCalendarDays(new Date(), date) < 7) return format(date, 'EEE');
    return format(date, 'MMM d');
}

export function formatDateSeparator(dateStr: string) {
    const date = new Date(dateStr);

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
}
