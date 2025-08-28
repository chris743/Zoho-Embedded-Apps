
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