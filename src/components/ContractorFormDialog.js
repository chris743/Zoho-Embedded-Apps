import React, { useEffect, useState } from "react";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField } from "@mui/material";


export default function ContractorFormDialog({ open, initial, onClose, onSubmit, notify }) {
const [model, setModel] = useState({ name: "", provides_trucking: false, provides_picking: false, provides_forklift: false });
const isEdit = !!initial;


useEffect(() => {
setModel(initial ? { ...initial } : { name: "", provides_trucking: false, provides_picking: false, provides_forklift: false });
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