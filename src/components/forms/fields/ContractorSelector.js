import React, { useMemo } from "react";
import { Stack, TextField, Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

export default function ContractorRolePicker({
    contractors = [],
    role = "harvest",
    valueId = null,
    rate = null,
    onChange,
    labels = {}
}) {
    const cfg = useMemo(() => {
        switch (role) {
            case "haul":
                return { flag: "provides_trucking", contractor: labels.contractor || "Hauler", rate: labels.rate || "Hauling Rate" };
            case "forklift":
                return { flag: "provides_forklift", contractor: labels.contractor || "Forklift Contractor", rate: labels.rate || "Forklift Rate" };
            default:
                return { flag: "provides_picking", contractor: labels.contractor || "Harvesting Contractor", rate: labels.rate || "Harvesting Rate" };
        }
    }, [role, labels]);


    const options = useMemo(() => {
        const norm = (c) => ({
            id: c.id ?? c.ID ?? c.contractor_id,
            name: c.name ?? c.NAME ?? "(unnamed)",
            provides_trucking: !!c.provides_trucking,
            provides_picking: !!c.provides_picking,
            provides_forklift: !!c.provides_forklift,
            phone: c.primary_contact_phone ?? c.office_phone ?? "",
        });
        return (contractors || [])
            .map(norm)
            .filter((c) => c[cfg.flag])
            .map((c) => ({ ...c, label: `${c.name}${c.phone ? ` — ${c.phone}` : ""}` }));
    }, [contractors, cfg.flag]);


    const selected = useMemo(() => options.find((o) => String(o.id) === String(valueId)) || null, [options, valueId]);


    return (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
            <Autocomplete
                options={options}
                value={selected}
                onChange={(_, opt) => onChange?.(opt ? { id: opt.id, rate } : null)}
                isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                getOptionLabel={(o) => o?.label || ""}
                renderInput={(params) => (
                    <TextField {...params} label={cfg.contractor} placeholder="Start typing a name" />
                )}
                sx={{ flex: 1 }}
            />
            <Tooltip title={selected ? "Enter rate for this contractor" : "Pick a contractor first"}>
                <TextField
                    label={cfg.rate}
                    type="number"
                    value={rate ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        const n = val === "" ? null : Number(val);
                        if (Number.isNaN(n)) return;
                        onChange?.(selected ? { id: selected.id, rate: n } : { id: null, rate: n });
                    }}
                    disabled={!selected}
                    sx={{ width: 220 }}
                />
            </Tooltip>
        </Stack>
    );
}