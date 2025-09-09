// Consolidated date utilities for the entire application

export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function toYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sevenDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekdayShort(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date).getDay()];
}

export function formatRangeLabel(start, end) {
  const format = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${format(start)} – ${format(end)}`;
}

export function formatDate(ds) {
  if (!ds) return "-";
  try {
    // Handle both Date objects and date strings
    const d = ds instanceof Date ? ds : new Date(ds);
    if (isNaN(d.getTime())) return "-";
    const mm = String(d.getMonth() + 1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch { 
    return "-"; 
  }
}

export function formatDateLong(date) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch { 
    return date; 
  }
}

export function formatTime(date) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch { 
    return date; 
  }
}

export function isToday(date) {
  const today = new Date();
  const target = new Date(date);
  return today.toDateString() === target.toDateString();
}

export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
}
