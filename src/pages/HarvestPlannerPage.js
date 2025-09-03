import React, { useEffect, useMemo, useState } from "react";
import { HarvestPlansTable } from "../components/HarvestPlansTable";
import { Box, Button, Container, Stack, TextField, Snackbar, ToggleButtonGroup, ToggleButton, Paper, Typography, Divider } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TableRowsIcon from "@mui/icons-material/TableRows";
import { HarvestPlansApi } from "../api/harvestPlans";
import { makeApi } from "../api/client"; // reuse the axios factory from earlier canvas
import PlannerDialog from "../components/PlannerDialog";
import { BlocksApi } from "../api/blocks";
import { PoolsApi } from "../api/pools"
import { ContractorsApi } from "../api/contractors";
import { CommoditiesApi } from "../api/commodities";
import { ScoutReportsApi } from "../api/scoutReports";
import { WeeklyPlannerBoard } from "../components/WeeklyPlannerComponents/WeeklyPlannerBoard";
import { WeekPicker } from "../components/WeekPicker";
import { DateRangePicker } from "../components/DateRangePicker";
import ViewPlanDialog from "../components/harvestPlanViewModal/HarvestPlanViewModal";
import { initializeCommodityColors } from "../utils/theme";


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
    const scoutReportsSvc = useMemo(() => ScoutReportsApi(api), [api]);


    const [toast, setToast] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 7 * 86400000));
    const [dateTo, setDateTo] = useState(() => new Date(Date.now() + 14 * 86400000));
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
            
            // Initialize commodity colors in consistent order
            const commodityNames = arr
                .map(c => c.commodity || c.Commodity || c.DESCR || c.descr)
                .filter(name => name && name.trim());
            initializeCommodityColors(commodityNames);
            
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

    const handleDateRangeChange = (startDate, endDate) => {
        setDateFrom(startDate);
        setDateTo(endDate);
    };
    useEffect(() => { load(); loadBlocks(); loadPools(); loadContractors(); loadCommodities();}, []);

// client-side filter by date range (inclusive)
const filtered = rows.filter(r => {
    if (!r.date) return false;
    const planDate = new Date(r.date);
    const fromDate = dateFrom ? new Date(dateFrom.toISOString().slice(0, 10)) : null;
    const toDate = dateTo ? new Date(dateTo.toISOString().slice(0, 10)) : null;
    
    if (fromDate && planDate < fromDate) return false;
    if (toDate && planDate > toDate) return false;
    return true;
}).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

return (
    <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
        {/* Header Section */}
        <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'background.paper', border: '1px solid #E8EBF0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Harvest Planning
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => { setEditRow(null); setDialogOpen(true); }}
                    sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                >
                    New Plan
                </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Controls Section */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                {view === "table" ? (
                    <Stack direction="row" spacing={2} alignItems="center">
                        <DateRangePicker
                            startDate={dateFrom}
                            endDate={dateTo}
                            onChange={handleDateRangeChange}
                            placeholder="Select date range"
                            size="small"
                            sx={{ width: 280 }}
                        />
                        <Button 
                            variant="outlined" 
                            startIcon={<RefreshIcon />} 
                            onClick={load}
                            sx={{ 
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Refresh
                        </Button>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={2} alignItems="center">
                        <WeekPicker 
                            weekStart={weekStart}
                            onWeekChange={setWeekStart}
                        />
                        <Button 
                            variant="outlined" 
                            startIcon={<RefreshIcon />} 
                            onClick={load}
                            sx={{ 
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Refresh
                        </Button>
                    </Stack>
                )}
                
                <Box sx={{ flexGrow: 1 }} />
                
                <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={(_, val) => val && setView(val)}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            border: '1px solid #E0E4E7',
                            borderRadius: 1,
                            px: 2,
                            py: 0.75,
                            textTransform: 'none',
                            fontWeight: 500,
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            },
                        }
                    }}
                >
                    <ToggleButton value="table">
                        <TableRowsIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        Table View
                    </ToggleButton>
                    <ToggleButton value="column">
                        <ViewColumnIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        Column View
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>
        </Paper>

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
            pools={pools}
            contractors={contractors}
            commodities={commodities}
            scoutReportsSvc={scoutReportsSvc}
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
        
        {view === "table" ? (
            <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid #E8EBF0', borderRadius: 2 }}>
                <HarvestPlansTable
                    plans={filtered}
                    blocks={blocks}
                    commodities={commodities}
                    contractors={contractors}
                    onRowClick={(row) => { setEditRow(row); setDialogOpen(true); }}
                    onViewClick={(row) => { setViewRow(row); setViewDialogOpen(true); }}
                />
            </Paper>
        ) : (
            <WeeklyPlannerBoard
                plans={rows}
                blocks={blocks}
                contractors={contractors}
                commodities={commodities}
                onEdit={(row) => {setEditRow(row); setDialogOpen(true);}}
                onView={(row) => {setViewRow(row); setViewDialogOpen(true);}}
                svc={svc}
                weekStart={weekStart}
                onWeekChange={setWeekStart}
                onReload={load}
            />
        )}
    </Container>
);
}