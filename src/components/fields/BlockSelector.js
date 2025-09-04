import React, { useMemo } from "react";
import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

/**
 * BlockSelector
 * props:
 *  - blocks: array of blocks from /Blocks
 *  - value: { source_database: string, id: number } | null
 *  - onChange: (next: { source_database: string, id: number } | null) => void
 */
export function BlockSelector({ blocks = [], value, onChange }) {
  // Normalize incoming blocks (handle API casing like GABLOCKIDX/NAME/GrowerName)
  // Filter to only blocks where ID starts with "2" and inactiveflag == "n"
  const options = useMemo(
    () =>
      (blocks || [])
        .filter((b) => {
          const blockId = String(b.id ?? "");
          const inactiveFlag = b.inactiveflag ?? b.INACTIVEFLAG ?? b.inactiveFlag;
          return blockId.startsWith("2") && inactiveFlag === "n";
        })
        .map((b) => {
          const source = b.source_database ?? b.sourceDatabase ?? "";
          const idx =
            b.gablockidx;
          const name = b.name;
          return {
            key: `${source}:${idx}`,
            source_database: source,
            id: idx,
            label: `${b.id} — ${name || "(no name)"}`,
          };
        }),
    [blocks]
  );

  // Find selected option from the external value
  const selected =
    value &&
    options.find(
      (o) =>
        o.source_database === value.source_database && o.id === value.id
    );

  return (
    <Autocomplete
      options={options}
      value={selected || null}
      onChange={(_, opt) =>
        onChange?.(opt ? { source_database: opt.source_database, id: opt.id } : null)
      }
      isOptionEqualToValue={(o, v) => o.key === v.key}
      getOptionLabel={(o) => o.label}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Block (source:GABLOCKIDX)"
          placeholder="e.g. DM01:123"
        />
      )}
    />
  );
}
