import React, { useEffect, useState } from "react";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Box, InputAdornment } from "@mui/material";


export default function ContractorFormDialog({ open, initial, onClose, onSubmit, notify }) {
const [model, setModel] = useState({ name: "", provides_trucking: false, provides_picking: false, provides_forklift: false, color: "" });
const isEdit = !!initial;


useEffect(() => {
setModel(initial ? { ...initial } : { name: "", provides_trucking: false, provides_picking: false, provides_forklift: false, color: "" });
}, [initial, open]);


const save = async () => {
if (!model.name || !model.name.trim()) { notify && notify("Name is required"); return; }
await onSubmit(model, isEdit);
};


return (
<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
<DialogTitle>{isEdit ? "Edit Contractor" : "New Contractor"}</DialogTitle>
<DialogContent>
<Stack spacing={2} sx={{ mt: 1 }}>
<TextField label="Name" value={model.name || ""} onChange={(e) => setModel({ ...model, name: e.target.value })} required />
<TextField label="Primary Contact" value={model.primary_contact_name || ""} onChange={(e) => setModel({ ...model, primary_contact_name: e.target.value })} />
<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
<TextField label="Primary Phone" value={model.primary_contact_phone || ""} onChange={(e) => setModel({ ...model, primary_contact_phone: e.target.value })} />
<TextField label="Office Phone" value={model.office_phone || ""} onChange={(e) => setModel({ ...model, office_phone: e.target.value })} />
</Stack>
<TextField label="Mailing Address" value={model.mailing_address || ""} onChange={(e) => setModel({ ...model, mailing_address: e.target.value })} />
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <TextField 
        label="Color" 
        value={model.color || "#000000"} 
        onChange={(e) => setModel({ ...model, color: e.target.value })} 
        size="small"
        sx={{ flex: 1 }}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <Box
                        component="label"
                        sx={{
                            position: 'relative',
                            display: 'inline-block',
                            cursor: 'pointer',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '1px solid rgba(0, 0, 0, 0.23)',
                            overflow: 'hidden',
                        }}
                    >
                        <input
                            type="color"
                            value={model.color || "#FFFFFF"}
                            onChange={(e) => setModel({ ...model, color: e.target.value })}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                margin: 0,
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                            }}
                        />
                        <style>{`
                            input[type="color"]::-webkit-color-swatch-wrapper {
                                padding: 0;
                            }
                            input[type="color"]::-webkit-color-swatch {
                                border: none;
                            }
                            input[type="color"]::-moz-color-swatch {
                                border: none;
                            }
                        `}</style>
                    </Box>
                </InputAdornment>
            ),
        }}
    />
</Box>
<Stack direction={{ xs: "column", sm: "row" }}>
<FormControlLabel control={<Checkbox checked={!!model.provides_trucking} onChange={(e) => setModel({ ...model, provides_trucking: e.target.checked })} />} label="Provides Trucking" />
<FormControlLabel control={<Checkbox checked={!!model.provides_picking} onChange={(e) => setModel({ ...model, provides_picking: e.target.checked })} />} label="Provides Picking" />
<FormControlLabel control={<Checkbox checked={!!model.provides_forklift} onChange={(e) => setModel({ ...model, provides_forklift: e.target.checked })} />} label="Provides Forklift" />
</Stack>
</Stack>
</DialogContent>
<DialogActions>
<Button onClick={onClose}>Cancel</Button>
<Button variant="contained" onClick={save}>{isEdit ? "Save" : "Create"}</Button>
</DialogActions>
</Dialog>
);
}