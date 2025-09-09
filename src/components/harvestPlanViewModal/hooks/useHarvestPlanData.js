import { useMemo } from "react";
import { buildPoolMap, getPoolIdxFromPlan } from "../../../utils/dataUtils";

/**
 * Custom hook for processing harvest plan data and building lookup maps
 */
export function useHarvestPlanData({ plan, contractors, pools }) {
  // Build lookup maps
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

  const poolByIdx = useMemo(() => {
    if (!Array.isArray(pools)) return new Map();
    return buildPoolMap(pools, false);
  }, [pools]);

  // Resolve associated entities using new data structure
  const block = plan?.block || null;
  const commodity = plan?.commodity || null;

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

  // Use commodity data from the new structure
  const commodityName = useMemo(() => {
    if (!commodity) return "";
    return commodity.commodity || commodity.invoiceCommodity || "";
  }, [commodity]);

  return {
    block,
    commodity,
    labor,
    forklift,
    hauler,
    poolName,
    commodityName,
    pool_idx
  };
}
