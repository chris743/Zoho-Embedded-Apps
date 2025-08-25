// plannedharvest.js — Planned Harvests page with CRUD (Material UI)
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from "@mui/material";
import { Add, Edit, Delete, Search as SearchIcon } from "@mui/icons-material";

import {
  fetchPlannedHarvests,
  createPlannedHarvest,
  updatePlannedHarvest,
  deletePlannedHarvest,
  usingOffline,
} from "../api";

function normalizeList(payload){
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (payload && Array.isArray(payload.value)) return payload.value;
    if (payload && Array.isArray(payload.results)) return payload.results;
    return [];
}

export default function HarvestPlanPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [offline, setOffline] = useState(false);

  const [draft, setDraft] = useState({ plannedDate: new Date().toISOString().slice(0, 10), unit: "bins" });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchPlannedHarvests();
    const list = normalizeList(data);
    setItems(list);
    setOffline(usingOffline());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((x) => [x.cropName, x.field, x.unit, x.notes ?? ""].some((v) => String(v).toLowerCase().includes(q)));
  }, [items, query]);

  const startCreate = () => {
    setDraft({ plannedDate: new Date().toISOString().slice(0, 10), unit: "bins" });
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (row) => {
    setEditing(row);
    setDraft(row);
    setOpen(true);
  };

  const save = async () => {
    if (editing) {
      const updated = await updatePlannedHarvest(editing.id, { ...editing, ...draft });
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } else {
      const created = await createPlannedHarvest(draft);
      setItems((prev) => [...prev, created]);
    }
    setOpen(false);
  };

  const remove = async (id) => {
    await deletePlannedHarvest(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardHeader title="Planned Harvests" />
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
            <TextField
              placeholder="Search crops, fields, units..."
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{ startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )}}
              sx={{ width: { xs: "100%", sm: 320 } }}
            />
            <Button variant="contained" startIcon={<Add />} onClick={startCreate} sx={{ ml: { sm: "auto" } }}>
              New
            </Button>
          </Stack>

          {loading ? (
            <Typography sx={{ p: 6 }} color="text.secondary">Loading…</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Crop</TableCell>
                    <TableCell>Field</TableCell>
                    <TableCell>Planned Date</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell><strong>{row.cropName}</strong></TableCell>
                      <TableCell>{row.field}</TableCell>
                      <TableCell>{row.plannedDate}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell style={{ color: "#6b7280" }}>{row.notes}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => startEdit(row)} title="Edit"><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => remove(row.id)} title="Delete"><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {offline && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              API not reachable — using local demo data (stored in this browser). Hook up your backend at <code>/api/planned-harvests</code> for live CRUD.
            </Typography>
          )}
        </CardContent>
      </Card>

      <EditDialog open={open} setOpen={setOpen} draft={draft} setDraft={setDraft} onSave={save} isEdit={!!editing} />
    </Stack>
  );
}

function EditDialog({ open, setOpen, draft, setDraft, onSave, isEdit }) {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit" : "New"} Planned Harvest</DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Crop"
            value={draft.cropName ?? ""}
            onChange={(e) => setDraft({ ...draft, cropName: e.target.value })}
          />
          <TextField
            fullWidth
            label="Field"
            value={draft.field ?? ""}
            onChange={(e) => setDraft({ ...draft, field: e.target.value })}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Planned Date"
            type="date"
            value={draft.plannedDate ?? ""}
            onChange={(e) => setDraft({ ...draft, plannedDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={draft.quantity ?? 0}
            onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
          />
          <TextField
            fullWidth
            label="Unit"
            value={draft.unit ?? ""}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          />
        </Stack>
        <TextField
          multiline
          minRows={3}
          label="Notes"
          sx={{ mt: 2 }}
          value={draft.notes ?? ""}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>{isEdit ? "Save changes" : "Create"}</Button>
      </DialogActions>
    </Dialog>
  );
}
