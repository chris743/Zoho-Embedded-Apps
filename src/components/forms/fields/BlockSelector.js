import React, { useMemo } from "react";
import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

/**
 * BlockSelector
 * props:
 *  - blocks: array of blocks from /Blocks API
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
          const inactiveFlag = b.INACTIVEFLAG ?? b.inactiveflag ?? b.inactiveFlag;
          const source = b.source_database ?? b.sourceDatabase ?? "";
          return blockId.startsWith("2") && inactiveFlag === "N" && source === "COBBLESTONE";
        })
        .map((b) => {
          const source = b.source_database ?? b.sourceDatabase ?? "";
          const idx = b.GABLOCKIDX ?? b.gablockidx ?? b.gablockIdx;
          const name = b.NAME ?? b.name;
          const blockId = b.ID ?? b.id ?? "";
          return {
            key: `${source}:${idx}`,
            source_database: source,
            id: idx,
            blockId: blockId, // Store the actual block ID for filtering
            label: `${blockId} - ${name || "(no name)"}`,
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

  // Debug logging
  console.log('BlockSelector Debug:', {
    value,
    selected,
    optionsCount: options.length,
    firstOption: options[0],
    sampleBlocks: (blocks || []).slice(0, 3).map(b => ({
      id: b.id,
      ID: b.ID,
      name: b.name,
      NAME: b.NAME,
      gablockidx: b.gablockidx,
      GABLOCKIDX: b.GABLOCKIDX,
      inactiveflag: b.inactiveflag,
      INACTIVEFLAG: b.INACTIVEFLAG
    }))
  });

  return (
    <Autocomplete
      options={options}
      value={selected || null}
      onChange={(_, opt) =>
        onChange?.(opt ? { source_database: opt.source_database, id: opt.id } : null)
      }
      isOptionEqualToValue={(o, v) => o.key === v.key}
      getOptionLabel={(o) => o.label}
      filterOptions={(options, { inputValue }) => {
        if (!inputValue) return options;
        
        const searchTerm = inputValue.toLowerCase().trim();
        console.log('Filtering with searchTerm:', searchTerm);
        
        // If the search term looks like a block ID (starts with numbers), filter by blockId only
        if (/^\d/.test(searchTerm)) {
          const filtered = options.filter(option => 
            option.blockId.toLowerCase().startsWith(searchTerm)
          );
          console.log('Number search - filtered results:', filtered.length, filtered.map(f => f.blockId));
          return filtered;
        }
        
        // Otherwise, filter by name (case-insensitive)
        const filtered = options.filter(option => 
          option.label.toLowerCase().includes(searchTerm)
        );
        console.log('Text search - filtered results:', filtered.length);
        return filtered;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab' && options.length > 0) {
          // Auto-select the first option when Tab is pressed
          const firstOption = options[0];
          onChange?.({ source_database: firstOption.source_database, id: firstOption.id });
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Block"
          placeholder="e.g. 2100702 - GLESS, JOHN J. -- P36-02 LEMON"
        />
      )}
    />
  );
}
