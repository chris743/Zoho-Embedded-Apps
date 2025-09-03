import { useMemo } from "react";
import { buildCommodityMap, getCommodityIdxFromBlockOrPlan } from "../../utils/commodities";
import { buildPoolMap, getPoolIdxFromPlan } from "../../utils/pools";

/**
 * Custom hook for processing harvest plan data and building lookup maps
 */
export function useHarvestPlanData({ plan, blocks, contractors, commodities, pools }) {
  // Build lookup maps
  const blockByKey = useMemo(() => {
    const m = new Map();
    for (const b of blocks) {
      const src = b.source_database ?? b.sourceDatabase ?? "";
      const idx = b.GABLOCKIDX ?? b.gablockidx ?? b.id;
      if (src && idx != null) {
        m.set(`${src}:${idx}`, b);
      }
    }
    return m;
  }, [blocks]);

  const contractorById = useMemo(() => {
    const m = new Map();
    for (const c of contractors) {
      const id = c.id ?? c.ID ?? c.contractor_id;
      if (id != null) {
        m.set(Number(id), c);
      }
    }
    return m;
  }, [contractors]);

  const commodityByIdx = useMemo(() => {
    if (!Array.isArray(commodities)) return new Map();
    return buildCommodityMap(commodities, false);
  }, [commodities]);

  const poolByIdx = useMemo(() => {
    if (!Array.isArray(pools)) return new Map();
    return buildPoolMap(pools, false);
  }, [pools]);

  // Resolve associated entities
  const blockKey = useMemo(() => {
    if (!plan?.grower_block_source_database || plan?.grower_block_id == null) return null;
    return `${plan.grower_block_source_database}:${plan.grower_block_id}`;
  }, [plan]);

  const block = blockKey ? blockByKey.get(blockKey) : null;

  const labor = useMemo(() => {
    if (!plan?.contractor_id) return null;
    return contractorById.get(Number(plan.contractor_id)) || null;
  }, [plan?.contractor_id, contractorById]);

  const forklift = useMemo(() => {
    if (!plan?.forklift_contractor_id) return null;
    return contractorById.get(Number(plan.forklift_contractor_id)) || null;
  }, [plan?.forklift_contractor_id, contractorById]);

  const hauler = useMemo(() => {
    if (!plan?.hauler_id) return null;
    return contractorById.get(Number(plan.hauler_id)) || null;
  }, [plan?.hauler_id, contractorById]);

  const pool_idx = useMemo(() => getPoolIdxFromPlan(plan), [plan]);
  const poolName = useMemo(() => {
    if (!pool_idx) return "";
    return poolByIdx.get(String(pool_idx)) || null;
  }, [pool_idx, poolByIdx]);

  const commodity_idx = useMemo(() => getCommodityIdxFromBlockOrPlan(block, plan), [block, plan]);
  const commodityName = useMemo(() => {
    if (!commodity_idx) return "";
    return commodityByIdx.get(String(commodity_idx)) || "";
  }, [commodity_idx, commodityByIdx]);

  return {
    block,
    labor,
    forklift,
    hauler,
    poolName,
    commodityName,
    commodity_idx,
    blockKey
  };
}
