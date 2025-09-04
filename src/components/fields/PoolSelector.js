import React, { useMemo } from "react";
import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

/**
 * PoolSelector
 * props:
 *  - pools: array of pools
 *  - value: number | null   // current pool_id
 *  - onChange: (pool_id: number | null) => void
 */
export function PoolSelector({ pools = [], value, onChange }) {
  // Normalize incoming pool objects (handles different casings/keys)
  // Filter out pools where ICCCLOSEDFLAG == "N"
  const options = useMemo(() => {
    return (pools || [])
      .filter((p) => {
        const iccClosedFlag = p.ICCCLOSEDFLAG ?? p.iccclosedflag ?? p.iccClosedFlag;
        return iccClosedFlag !== "N";
      })
      .map((p) => {
        const poolId =
          p.pool_id ?? p.poolid ?? p.poolidx ?? p.POOL_ID ?? p.POOLID ?? p.POOLIDX ?? p.id;
        const code = p.code ?? p.CODE ?? p.id ?? "";       // display code/name
        const descr = p.descr ?? p.DESCR ?? p.description ?? "";
        const key = String(poolId ?? code);
        return {
          key,
          pool_id: poolId ?? null,
          label: `${code || poolId}${descr ? ` - ${descr}` : ""}`,
        };
      });
  }, [pools]);

  const selected =
    value == null
      ? null
      : options.find((o) => String(o.pool_id) === String(value)) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_, opt) => onChange?.(opt ? opt.pool_id : null)}
      isOptionEqualToValue={(o, v) => o.key === v.key}
      getOptionLabel={(o) => o?.label || ""}
      renderInput={(params) => (
        <TextField {...params} label="Pool" placeholder="e.g., C2XXXXX" />
      )}
    />
  );
}
