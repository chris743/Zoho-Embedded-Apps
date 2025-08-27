import React, { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ContractorsTable from "../components/ContractorsTable";
import ContractorFormDialog from "../components/ContractorFormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import { useApiConfig } from "../hooks/useApiConfig";
import { ContractorsApi } from "../api/contractors";


export default function HarvestContractorsPage() {
const { apiBase, setApiBase, jwt, setJwt, api, save } = useApiConfig();
const svc = ContractorsApi(api);


const [toast, setToast] = useState(null);
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(false);
const [search, setSearch] = useState("");
const [dialogOpen, setDialogOpen] = useState(false);
const [editRow, setEditRow] = useState(null);
const [confirm, setConfirm] = useState({ open: false, id: null });


const load = async () => {
setLoading(true);
try {
const { data } = await svc.list({ search, take: 200 });
const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
setRows(arr);
} catch (err) { console.error(err); setToast(err?.message || "Failed to load contractors"); }
finally { setLoading(false); }
};
useEffect(() => { load(); }, []);


const handleCreate = () => { setEditRow(null); setDialogOpen(true); };
const handleEdit = (row) => { setEditRow(row); setDialogOpen(true); };
const handleDelete = (row) => setConfirm({ open: true, id: row.id });


const submitContractor = async (model, isEdit) => {
try {
if (isEdit) {
await svc.update(model.id, {
name: model.name,
primary_contact_name: model.primary_contact_name,
primary_contact_phone: model.primary_contact_phone,
office_phone: model.office_phone,
mailing_address: model.mailing_address,
provides_trucking: !!model.provides_trucking,
provides_picking: !!model.provides_picking,
provides_forklift: !!model.provides_forklift,
});
setToast("Updated");
} else {
const { data } = await svc.create({
name: model.name,
primary_contact_name: model.primary_contact_name,
primary_contact_phone: model.primary_contact_phone,
office_phone: model.office_phone,
mailing_address: model.mailing_address,
provides_trucking: !!model.provides_trucking,
provides_picking: !!model.provides_picking,
provides_forklift: !!model.provides_forklift,
});
setToast(`Created #${data.id}`);
}
await load();
setDialogOpen(false);
} catch (err) {
setToast(err?.response?.data?.title || err?.message || "Save failed");
}
};
const doDelete = async () => {
try {
await svc.remove(confirm.id);
setToast("Deleted");
await load();
} catch (err) { setToast(err?.message || "Delete failed"); }
finally { setConfirm({ open: false, id: null }); }
};


return (
<AppShell
title="Harvest Contractors — Maintenance"
apiBase={apiBase}
setApiBase={setApiBase}
jwt={jwt}
setJwt={setJwt}
onSave={() => { save(); setToast("Saved API settings"); }}
toast={toast}
setToast={setToast}
>
<ContractorsTable
rows={rows}
loading={loading}
search={search}
setSearch={setSearch}
onRefresh={load}
onCreate={handleCreate}
onEdit={handleEdit}
onDelete={handleDelete}
/>


<ContractorFormDialog
open={dialogOpen}
initial={editRow}
onClose={() => setDialogOpen(false)}
onSubmit={submitContractor}
notify={setToast}
/>


<ConfirmDialog
open={confirm.open}
title="Delete contractor?"
message="This action cannot be undone."
onCancel={() => setConfirm({ open: false, id: null })}
onConfirm={doDelete}
/>
</AppShell>
);
}