// Consolidated commodity utilities for the entire application
export function buildCommodityMap(commodities = [], onlyCobblestone = true) {
  const m = new Map();
  for (const c of commodities) {
    // optional source filter
    const src = (c.source_database ?? c.SOURCE_DATABASE ?? "").toString().toLowerCase();
    if (onlyCobblestone && src && src !== "cobblestone") continue;

    // be defensive about id/name casings & variants
    const idx =
      c.commodityIDx ?? c.commodityIdx ?? c.COMMODITYIDX ??
      c.CMTYIDX ?? c.cmtyidx ?? c.id ?? c.code;

    const name =
      c.commodity ?? c.DESCR ?? c.descr ?? c.name ?? c.NAME ?? String(idx ?? "");

    if (idx != null) m.set(String(idx), String(name));
  }
  return m;
}

export function getCommodityIdxFromBlockOrPlan(block, plan) {
  return (
    block?.CMTYIDX ?? block?.cmtyidx ??
    block?.VARIETYIDX ?? block?.varietyidx ??
    plan?.cmtyidx ?? plan?.commodityIdx ?? plan?.commodityIDx ?? null
  );
}
