import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Paper, Typography, Snackbar } from "@mui/material";
import ContractorsTable from "../components/ContractorsTable";
import ContractorFormDialog from "../components/ContractorFormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import { useApiConfig } from "../hooks/useApiConfig";
import { ContractorsApi } from "../api/contractors";


export default function HarvestContractorsPage() {
    const { apiBase, setApiBase, jwt, setJwt, api, save } = useApiConfig();
    const svc = useMemo(() => ContractorsApi(api), [api]);

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
        } catch (err) { 
            console.error(err); 
            setToast(err?.message || "Failed to load contractors"); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        load(); 
    }, []);

    const handleCreate = () => { 
        setEditRow(null); 
        setDialogOpen(true); 
    };

    const handleEdit = (row) => { 
        setEditRow(row); 
        setDialogOpen(true); 
    };

    const handleDelete = (row) => 
        setConfirm({ open: true, id: row.id });

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
                setToast("Contractor updated successfully");
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
                setToast(`Contractor created successfully #${data.id}`);
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
            setToast("Contractor deleted successfully");
            await load();
        } catch (err) { 
            setToast(err?.message || "Delete failed"); 
        } finally { 
            setConfirm({ open: false, id: null }); 
        }
    };

    return (
        <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
            {/* Header Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'background.paper', border: '1px solid #E8EBF0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Contractor Management
                    </Typography>
                </Box>
            </Paper>

            {/* Main Content */}
            <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid #E8EBF0', borderRadius: 2 }}>
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
            </Paper>

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

            <Snackbar 
                open={!!toast} 
                autoHideDuration={4000} 
                onClose={() => setToast(null)} 
                message={toast || ''} 
                sx={{
                    '& .MuiSnackbarContent-root': {
                        borderRadius: 2,
                        bgcolor: 'success.main'
                    }
                }}
            />
        </Container>
    );
}