export function formatRate(rate) {
  if (rate == null || rate === "") return "-";
  const num = Number(rate);
  if (isNaN(num)) return rate;
  return `$${num.toFixed(2)}`;
}


export function formatCoordinate(coord) {
  if (coord == null || coord === "") return "-";
  const num = Number(coord);
  if (isNaN(num)) return coord;
  return num.toFixed(6);
}

