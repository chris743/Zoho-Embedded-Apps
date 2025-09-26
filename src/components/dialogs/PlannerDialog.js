import React, { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Tabs, Tab, Box, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@mui/material";
import { BlockSelector } from "../forms/fields/BlockSelector"
import { PoolSelector } from "../forms/fields/PoolSelector";
import { PlaceholderGrowerSelector } from "../forms/fields/PlaceholderGrowerSelector";
import { FieldRepresentativeSelector } from "../forms/fields/FieldRepresentativeSelector";
import ContractorRolePicker from "../forms/fields/ContractorSelector";

export default function PlannerDialog({ open, initial, onClose, onSaved, svc, blocks = [], pools = [], contractors=[], commodities=[]}) {
    const empty = {
        date: new Date().toISOString().slice(0, 10),
        grower_block_source_database: "DM01",
        grower_block_id: 0,
        planned_bins: null,
        bins: null,
        deliver_to: "",
        packed_by: "",
        notes_general: "",
        contractor_id: null,
        harvesting_rate: null,
        hauler_id: null,
        hauling_rate: null,
        forklift_contractor_id: null,
        forklift_rate: null,
        pool_id: null,
        use_placeholder_grower: false,
        placeholder_grower_id: null,
        placeholder_grower_name: "",
        placeholder_commodity_name: "",
        field_representative_id: null,
        field_representative: null
    };
    const [model, setModel] = useState(empty);
    const isEdit = !!initial;
    const [tab, setTab] = useState(0);

    useEffect(() => {
        setModel(initial ? normalize(initial) : empty);
        setTab(0);
    }, [initial, open]);


    const save = async () => {
        try {
            const payload = toDto(model);
            if (isEdit) await svc.update(model.id, payload); else await svc.create(payload);
            onSaved && onSaved();
        } catch (err) {
            console.log(JSON.stringify(toDto(model)));
            console.error(err);
            alert(err?.response?.data?.title || err?.message || "Save failed");
        }
    };


    const del = async () => {
        if (!window.confirm("Delete this plan?")) return;
        try { await svc.remove(model.id); onSaved && onSaved(); } catch (err) { alert(err?.message || "Delete failed"); }
    };


    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? "Edit Harvest Plan" : "New Harvest Plan"}</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                    <Tab label="General" />
                    <Tab label="Resources" />
                </Tabs>


                {tab === 0 && (
                    <Box>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} value={model.date} onChange={(e) => setModel({ ...model, date: e.target.value })} required />
                            
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Grower Selection</FormLabel>
                                <RadioGroup
                                    value={model.use_placeholder_grower ? "placeholder" : "specific"}
                                    onChange={(e) => setModel({ 
                                        ...model, 
                                        use_placeholder_grower: e.target.value === "placeholder",
                                        // Clear the other option when switching
                                        ...(e.target.value === "placeholder" ? {
                                            
                                        } : {
                                            placeholder_grower_name: "",
                                            placeholder_commodity_name: ""
                                        })
                                    })}
                                >
                                    <FormControlLabel 
                                        value="specific" 
                                        control={<Radio />} 
                                        label="Specific Block" 
                                    />
                                    <FormControlLabel 
                                        value="placeholder" 
                                        control={<Radio />} 
                                        label="Placeholder Grower (block unknown)" 
                                    />
                                </RadioGroup>
                            </FormControl>

                            {!model.use_placeholder_grower ? (
                                <BlockSelector
                                    blocks = {blocks}
                                        value = {{source_database: model.grower_block_source_database,
                                        id: model.grower_block_id
                                    }}
                                    onChange={(next) => {
                                    if (!next) return;
                                    setModel({
                                    ...model,
                                    grower_block_source_database: next.source_database,
                                    grower_block_id: next.id,
                                    });
                                }}
                                />
                            ) : (
                                <PlaceholderGrowerSelector
                                    value={{
                                        id: model.placeholder_grower_id,
                                        grower_name: model.placeholder_grower_name,
                                        commodity_name: model.placeholder_commodity_name
                                    }}
                                    onChange={(next) => {
                                        if (next) {
                                            setModel({
                                                ...model,
                                                placeholder_grower_id: next.id,
                                                placeholder_grower_name: next.grower_name,
                                                placeholder_commodity_name: next.commodity_name
                                            });
                                        } else {
                                            setModel({
                                                ...model,
                                                placeholder_grower_id: null,
                                                placeholder_grower_name: "",
                                                placeholder_commodity_name: ""
                                            });
                                        }
                                    }}
                                />
                            )}
                            <PoolSelector
                                pools={pools}
                                value={model.pool_id}                 // numeric or null
                                onChange={(nextId) =>                 // NOTE: onChange (camelCase)
                                    setModel({ ...model, pool_id: nextId })
                                }
                                />
                            <FieldRepresentativeSelector
                                value={model.field_representative}
                                onChange={(fieldRep) => setModel({ 
                                    ...model, 
                                    field_representative: fieldRep,
                                    field_representative_id: fieldRep?.id || null
                                })}
                            />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField label="Planned Bins" type="number" value={model.planned_bins ?? ''} onChange={(e) => setModel({ ...model, planned_bins: toNullableInt(e.target.value) })} />
                            </Stack>


                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField label="Deliver To" value={model.deliver_to || ''} onChange={(e) => setModel({ ...model, deliver_to: e.target.value })} />
                                <TextField label="Packed By" value={model.packed_by || ''} onChange={(e) => setModel({ ...model, packed_by: e.target.value })} />
                            </Stack>


                            <TextField label="Notes" multiline minRows={3} value={model.notes_general || ''} onChange={(e) => setModel({ ...model, notes_general: e.target.value })} />
                        </Stack>
                    </Box>
                )}

                {tab === 1 && (
                    <Box>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <ContractorRolePicker
                        role="harvest"
                        contractors={contractors}         // <-- pass this prop into PlannerDialog (see below)
                        valueId={model.contractor_id}
                        rate={model.harvesting_rate}
                        onChange={(v) => setModel({
                            ...model,
                            contractor_id: v?.id ?? null,
                            harvesting_rate: v?.rate ?? null,
                        })}
                        />

                        <ContractorRolePicker
                        role="haul"
                        contractors={contractors}
                        valueId={model.hauler_id}
                        rate={model.hauling_rate}
                        onChange={(v) => setModel({
                            ...model,
                            hauler_id: v?.id ?? null,
                            hauling_rate: v?.rate ?? null,
                        })}
                        />

                        <ContractorRolePicker
                        role="forklift"
                        contractors={contractors}
                        valueId={model.forklift_contractor_id}
                        rate={model.forklift_rate}
                        onChange={(v) => setModel({
                            ...model,
                            forklift_contractor_id: v?.id ?? null,
                            forklift_rate: v?.rate ?? null,
                        })}
                        />
                    </Stack>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {isEdit && <Button color="error" onClick={del}>Delete</Button>}
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={save}>{isEdit ? "Save" : "Create"}</Button>
            </DialogActions>
        </Dialog>
    );
}


// helpers to map between API DTO shape and UI model
function normalize(x) {
    // Determine if this is a placeholder grower based on block source and ID
    const isPlaceholder = x.grower_block_source_database === "PLACEHOLDER" && x.grower_block_id === 999999;
    
    // Extract placeholder info from notes if it exists
    let placeholderGrowerName = '';
    let placeholderCommodityName = '';
    let placeholderGrowerId = null;
    
    if (isPlaceholder && x.notes_general) {
        const placeholderMatch = x.notes_general.match(/PLACEHOLDER GROWER: ([^|]+) \| COMMODITY: ([^\n]+)/);
        if (placeholderMatch) {
            placeholderGrowerName = placeholderMatch[1].trim();
            placeholderCommodityName = placeholderMatch[2].trim();
        }
    }
    
    return {
        id: x.id,
        date: (x.date?.slice?.(0, 10)) || '',
        grower_block_source_database: x.grower_block_source_database,
        grower_block_id: x.grower_block_id,
        planned_bins: x.planned_bins ?? null,
        bins: x.bins ?? null,
        deliver_to: x.deliver_to ?? '',
        packed_by: x.packed_by ?? '',
        notes_general: x.notes_general ?? '',
        contractor_id: x.contractor_id ?? null,
        harvesting_rate: x.harvesting_rate ?? null,
        hauler_id: x.hauler_id ?? null,
        hauling_rate: x.hauling_rate ?? null,
        forklift_contractor_id: x.forklift_contractor_id ?? null,
        forklift_rate: x.forklift_rate ?? null,
        pool_id: x.pool_id ?? null,
        use_placeholder_grower: isPlaceholder,
        placeholder_grower_id: x.placeholder_grower_id ?? null,
        placeholder_grower_name: placeholderGrowerName,
        placeholder_commodity_name: placeholderCommodityName,
        field_representative_id: x.field_representative_id ?? null,
        field_representative: null // Will be populated from field representative ID if needed
    };
}
function toDto(m) {
    // Handle placeholder grower by storing info in notes and using special block ID
    let notes = m.notes_general || "";
    let blockSource = m.grower_block_source_database;
    let blockId = m.grower_block_id;
    let placeholderGrowerId = null;
    
    if (m.use_placeholder_grower && m.placeholder_grower_name && m.placeholder_commodity_name) {
        // Use special placeholder block ID (999999) and store grower info in notes
        blockSource = "PLACEHOLDER";
        blockId = 999999;
        placeholderGrowerId = m.placeholder_grower_id;
        const placeholderInfo = `PLACEHOLDER GROWER: ${m.placeholder_grower_name} | COMMODITY: ${m.placeholder_commodity_name}`;
        notes = notes ? `${placeholderInfo}\n\n${notes}` : placeholderInfo;
    }
    
    return {
        grower_block_source_database: blockSource,
        grower_block_id: blockId,
        placeholder_grower_id: placeholderGrowerId,
        planned_bins: m.planned_bins,
        contractor_id: m.contractor_id ?? null,
        harvesting_rate: m.harvesting_rate ?? null,
        hauler_id: m.hauler_id ?? null,
        hauling_rate: m.hauling_rate ?? null,
        forklift_contractor_id: m.forklift_contractor_id ?? null,
        forklift_rate: m.forklift_rate ?? null,
        pool_id: m.pool_id ?? null,
        notes_general: notes || null,
        deliver_to: m.deliver_to || null,
        packed_by: m.packed_by || null,
        date: m.date ? new Date(m.date).toISOString() : null,
        bins: m.bins ?? null,
        field_representative_id: m.field_representative_id ?? null
    };
}
function toNullableInt(v) {
    if (v === '' || v == null) return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
}
