import React, { useEffect, useMemo, useState } from "react";
import { HarvestPlansTable } from "../components/HarvestPlansTable";
import { Box, Button, Container, Stack, TextField, Snackbar, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import { HarvestPlansApi } from "../api/harvestPlans";
import { makeApi } from "../api/client"; // reuse the axios factory from earlier canvas
import PlannerDialog from "../components/PlannerDialog";
import { BlocksApi } from "../api/blocks";
import { PoolsApi } from "../api/pools"
import { ContractorsApi } from "../api/contractors";
import { CommoditiesApi } from "../api/commodities";
import { WeeklyPlannerBoard } from "../components/WeeklyPlannerComponents/WeeklyPlannerBoard";
import ViewPlanDialog from "../components/ViewPlanDialog";


export default function HarvestPlannerPage() {
    const [weekStart, setWeekStart] = useState(new Date());
    const [apiBase, setApiBase] = useState(() => localStorage.getItem("apiBase") || "https://api.cobblestonecloud.com/api/v1");
    const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
    const api = useMemo(() => makeApi(apiBase, jwt), [apiBase, jwt]);
    const svc = useMemo(() => HarvestPlansApi(api), [api]);
    const blocksSvc = useMemo(() => BlocksApi(api), [api]);
    const poolsSvc = useMemo(() => PoolsApi(api), [api]);
    const contractorSvc = useMemo(() => ContractorsApi(api), [api]);
    const commoditiesSvc = useMemo(() => CommoditiesApi(api), [api]);


    const [toast, setToast] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
    const [dateTo, setDateTo] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [viewRow, setViewRow] = useState(null);
    
    const [blocks, setBlocks] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [pools, setPools] = useState([]);
    const [commodities, setCommodities] = useState(null);

    const [view, setView] = useState("table");


    // Blocks cache for the Block picker (source_database + GABLOCKIDX)
    const loadBlocks = async () => {
        try {
            const { data } = await blocksSvc.list({ take: 1000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setBlocks(arr);
        } catch (err) { console.warn("Blocks load failed", err); }
    };

    const loadPools = async () => {
        try {
            const { data } = await poolsSvc.list({ take: 1000 })
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setPools(arr)
        } catch (err) {console.error(err); setToast(err?.message || "Failed to get pools");}
    };

    const loadContractors = async () => {
        try {
            const {data} = await contractorSvc.list({ take: 1000 })
            const arr = Array.isArray(data) ? data : (data?.items || data?.values)
            setContractors(arr)
        } catch (err) {console.error(err);}
    };

    const loadCommodities = async () => {
        try {
            const {data} = await commoditiesSvc.list({ take: 1000 })
            const arr = Array.isArray(data) ? data :(data?.items || data?.values)
            setCommodities(arr)
            console.log(arr)
        } catch (err) { console.warn("commodities load failed", err); }
    };
    
    const load = async () => {
        setLoading(true);
        try {
            const { data } = await svc.list({ take: 1000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setRows(arr);
        } catch (err) { console.error(err); setToast(err?.message || "Failed to load plans"); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); loadBlocks(); loadPools(); loadContractors(); loadCommodities();}, []);

// client-side filter by date range (inclusive)
const filtered = rows.filter(r => {
    if (!r.date) return false;
    const d = r.date.slice ? r.date.slice(0, 10) : r.date; // handle ISO strings
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
}).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

return (
    <Container maxWidth={false} sx={{ py: 1 }}>
        <Box sx = {{pb:1}}>
            <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(_, val) => val && setView(val)}
                size = "small"
                >
                    <ToggleButton value={"table"}>Table View</ToggleButton>
                    <ToggleButton value={"column"}>Column View</ToggleButton>
                </ToggleButtonGroup>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 1, width: 200 }} />
            <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 1, width: 200 }} />
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" onClick={load}>Refresh</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRow(null); setDialogOpen(true); }}>New Plan</Button>
        </Stack>

        <PlannerDialog
            open={dialogOpen}
            initial={editRow}
            onClose={() => setDialogOpen(false)}
            onSaved={async () => { await load(); setDialogOpen(false); setToast('Saved'); }}
            svc={svc}
            blocks={blocks}
            pools={pools}
            contractors={contractors}
        />
        <ViewPlanDialog
            open={viewDialogOpen}
            plan={viewRow}        
            onClose={() => setViewDialogOpen(false)}
            blocks={blocks}
            contractors={contractors}
            commodities={commodities}
        />
        <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} message={toast || ''} />
        {view === "table" ? (
        <Box sx={{width: '100%', bgcolor: 'white', borderRadius: 2 }}>
            <HarvestPlansTable
                plans={filtered}           // your date-range filtered plans
                blocks={blocks}
                commodities={commodities}
                contractors={contractors}
                onRowClick={(row) => { setEditRow(row); setDialogOpen(true); }}
                />
        </Box>
        ):(
        <WeeklyPlannerBoard
            plans = {rows}
            blocks = {blocks}
            contractors = {contractors}
            commodities = {commodities}
            onEdit = {(row) => {setEditRow(row); setDialogOpen(true);}}
            onView={(row) => {setViewRow(row); setViewDialogOpen(true);}}
            svc = {svc}
            weekStart = {weekStart}
            onWeekChange = {setWeekStart}
            onReload = {load}
        />
        )}
    </Container>
);
}