function formatDate(ds) {
  if (!ds) return "-";
  try {
    const d = new Date(ds);
    if (isNaN(d.getTime())) return ds;
    const mm = String(d.getMonth() + 1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch { return ds; }
}

export default formatDate;