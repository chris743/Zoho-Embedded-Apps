// src/utils/commodity.js
export function buildPoolMap(pools = [], onlyCobblestone = true) {
  const m = new Map();
  for (const p of pools) {
    // optional source filter
    const src = (p.source_database ?? p.SOURCE_DATABASE ?? "").toString().toLowerCase();
    if (onlyCobblestone && src && src !== "cobblestone") continue;

    // be defensive about id/name casings & variants
    const idx =
      p.poolidx

    const name =p.id

    if (idx != null) m.set(String(idx), String(name));
  }
  return m;
}

export function getPoolIdxFromPlan(plan) {
  return (
    plan?.pool_id ?? null
  );
}
