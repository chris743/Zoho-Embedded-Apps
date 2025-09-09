import React, { useMemo } from "react";
import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

/**
 * SimpleContractorSelector
 * props:
 *  - contractors: array of contractors
 *  - value: number | null   // current contractor id
 *  - onChange: (contractor_id: number | null) => void
 */
export function SimpleContractorSelector({ contractors = [], value, onChange }) {
  // Normalize incoming contractor objects (handles different casings/keys)
  const options = useMemo(() => {
    return (contractors || [])
      .map((c) => {
        const contractorId = c.id ?? c.ID ?? c.contractor_id;
        const name = c.name ?? c.NAME ?? "(unnamed)";
        const phone = c.primary_contact_phone ?? c.office_phone ?? "";
        return {
          key: String(contractorId),
          contractor_id: contractorId,
          label: `${name}${phone ? ` — ${phone}` : ""}`,
        };
      });
  }, [contractors]);

  const selected =
    value == null
      ? null
      : options.find((o) => String(o.contractor_id) === String(value)) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_, opt) => onChange?.(opt ? opt.contractor_id : null)}
      isOptionEqualToValue={(o, v) => o.key === v.key}
      getOptionLabel={(o) => o?.label || ""}
      renderInput={(params) => (
        <TextField {...params} label="Contractor" placeholder="Start typing a name" />
      )}
    />
  );
}
