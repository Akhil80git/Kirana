export function isToday(timestamp: number): boolean {
  if (!timestamp) return false;
  const d1 = new Date(timestamp);
  const now = new Date();
  return d1.getFullYear() === now.getFullYear() &&
         d1.getMonth() === now.getMonth() &&
         d1.getDate() === now.getDate();
}

export function isYesterday(timestamp: number): boolean {
  if (!timestamp) return false;
  const d1 = new Date(timestamp);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d1.getFullYear() === y.getFullYear() &&
         d1.getMonth() === y.getMonth() &&
         d1.getDate() === y.getDate();
}

export function formatCardDateTime(timestamp: number): { formatted: string; isToday: boolean; isYesterday: boolean } {
  if (!timestamp) return { formatted: '', isToday: false, isYesterday: false };
  const date = new Date(timestamp);

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  const today = isToday(timestamp);
  const yesterday = isYesterday(timestamp);

  if (today) {
    return { formatted: `आज • ${timeStr}`, isToday: true, isYesterday: false };
  }
  if (yesterday) {
    return { formatted: `कल • ${timeStr}`, isToday: false, isYesterday: true };
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return { formatted: `${day} ${month} ${year} • ${timeStr}`, isToday: false, isYesterday: false };
}

export function matchesDateFilter(timestamp: number, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'today') return isToday(timestamp);
  if (filter === 'yesterday') return isYesterday(timestamp);

  const now = new Date();
  if (filter === 'this_week') {
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    return timestamp >= oneWeekAgo;
  }

  if (filter === 'this_month') {
    const date = new Date(timestamp);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  return true;
}
