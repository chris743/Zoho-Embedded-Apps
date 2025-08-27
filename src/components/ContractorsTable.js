import React from "react";
import { Box, Button, Stack, TextField, Tooltip, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";


export default function ContractorsTable({ rows, loading, search, setSearch, onRefresh, onCreate, onEdit, onDelete }) {
const columns = [
{ field: "id", headerName: "ID", width: 90 },
{ field: "name", headerName: "Name", flex: 1 },
{ field: "primary_contact_name", headerName: "Primary Contact", width: 170 },
{ field: "primary_contact_phone", headerName: "Phone", width: 140 },
{ field: "office_phone", headerName: "Office", width: 140 },
{ field: "mailing_address", headerName: "Address", width: 220 },
{ field: "provides_trucking", headerName: "Trucking", type: "boolean", width: 110 },
{ field: "provides_picking", headerName: "Picking", type: "boolean", width: 110 },
{ field: "provides_forklift", headerName: "Forklift", type: "boolean", width: 110 },
{
field: "actions", headerName: "Actions", width: 160, sortable: false,
renderCell: (params) => (
<Stack direction="row" spacing={1}>
<Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(params.row)}><EditIcon /></IconButton></Tooltip>
<Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(params.row)}><DeleteIcon /></IconButton></Tooltip>
</Stack>
)
}
];


return (
<Box>
<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
<TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ bgcolor: "white", borderRadius: 1 }} />
<Button variant="outlined" onClick={onRefresh}>Search</Button>
<Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>New Contractor</Button>
</Stack>
<Box sx={{ height: 560, bgcolor: "white", borderRadius: 2 }}>
<DataGrid
rows={rows}
columns={columns}
loading={loading}
getRowId={(r) => r.id}
pageSizeOptions={[25, 50, 100]}
initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
/>
</Box>
</Box>
);
}