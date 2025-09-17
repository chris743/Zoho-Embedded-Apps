import React, { useEffect, useMemo, useState } from "react";
import { HarvestPlansTable } from "../components/tables/HarvestPlansTable";
import { Box, Button, Container, Stack, TextField, Snackbar, ToggleButtonGroup, ToggleButton, Paper, Typography, Divider, useMediaQuery, useTheme } from "@mui/material";
import { useViewMode } from "../contexts/ViewModeContext";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TableRowsIcon from "@mui/icons-material/TableRows";
import { HarvestPlansApi } from "../api/harvestPlans";
import { makeApi } from "../api/client"; // reuse the axios factory from earlier canvas
import PlannerDialog from "../components/dialogs/PlannerDialog";
import { BlocksApi } from "../api/blocks";
import { PoolsApi } from "../api/pools"
import { ContractorsApi } from "../api/contractors";
import { CommoditiesApi } from "../api/commodities";
import { ScoutReportsApi } from "../api/scoutReports";
import { WeeklyPlannerBoard } from "../components/planners/WeeklyPlannerComponents/WeeklyPlannerBoard";
import { WeekPicker } from "../components/WeekPicker";
import { DateRangePicker } from "../components/DateRangePicker";
import ViewPlanDialog from "../components/harvestPlanViewModal/HarvestPlanViewModal";
import { initializeCommodityColors } from "../utils/theme";
import { useAuth } from "../contexts/AuthContext";
import { useZohoAuth } from "../utils/zohoAuth";


export default function HarvestPlannerPage() {
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();
    
    // Determine if we should use mobile layout
    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);
    
    const [weekStart, setWeekStart] = useState(new Date());
    const [apiBase, setApiBase] = useState(() => localStorage.getItem("apiBase") || "https://api.cobblestonecloud.com/api/v1");
    const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
    
    // Get authentication state
    const { isAuthenticated: userAuth, loading: userLoading, token: userToken } = useAuth();
    const { isAuthenticated: zohoAuth, loading: zohoLoading, token: zohoToken } = useZohoAuth();
    
    // Determine which token to use
    const authToken = zohoToken || userToken || jwt;
    const isAuthenticated = zohoAuth || userAuth;
    const authLoading = zohoLoading || userLoading;
    
    // Debug token information
    console.log('🔍 Token Debug Info:', {
        zohoToken: zohoToken ? `${zohoToken.substring(0, 20)}...` : 'null',
        userToken: userToken ? `${userToken.substring(0, 20)}...` : 'null',
        jwt: jwt ? `${jwt.substring(0, 20)}...` : 'null',
        authToken: authToken ? `${authToken.substring(0, 20)}...` : 'null',
        zohoAuth,
        userAuth,
        isAuthenticated,
        authLoading
    });
    
    const api = useMemo(() => makeApi(apiBase, authToken), [apiBase, authToken]);
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

    // Force table view on mobile, otherwise allow user choice
    const [view, setView] = useState("table");
    const effectiveView = isMobile ? "table" : view;


    // Blocks cache for the Block picker (source_database + GABLOCKIDX)
    const loadBlocks = async () => {
        try {
            const { data } = await blocksSvc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setBlocks(arr);
        } catch (err) { console.warn("Blocks load failed", err); }
    };

    const loadPools = async () => {
        try {
            const { data } = await poolsSvc.list({ take: 10000 })
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setPools(arr)
        } catch (err) {console.error(err); setToast(err?.message || "Failed to get pools");}
    };

    const loadContractors = async () => {
        try {
            const {data} = await contractorSvc.list({ take: 10000 })
            const arr = Array.isArray(data) ? data : (data?.items || data?.values)
            setContractors(arr)
        } catch (err) {console.error(err);}
    };

    const loadCommodities = async () => {
        try {
            const {data} = await commoditiesSvc.list({ take: 10000 })
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
            const { data } = await svc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setRows(arr);
        } catch (err) { console.error(err); setToast(err?.message || "Failed to load plans"); }
        finally { setLoading(false); }
    };

    const handleDateRangeChange = (startDate, endDate) => {
        setDateFrom(startDate);
        setDateTo(endDate);
    };
    // Only load data when authenticated and not loading
    useEffect(() => { 
        if (isAuthenticated && !authLoading) {
            console.log('🔍 Loading data - authenticated:', isAuthenticated, 'loading:', authLoading);
            load(); 
            loadBlocks(); 
            loadPools(); 
            loadContractors(); 
            loadCommodities();
        } else {
            console.log('⏳ Waiting for authentication - authenticated:', isAuthenticated, 'loading:', authLoading);
        }
    }, [isAuthenticated, authLoading]);

// client-side filter by date range (inclusive)
const filtered = rows.filter(r => {
    if (!r.date) return false;
    const planDate = new Date(r.date);
    const planDateOnly = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
    
    if (dateFrom) {
        const fromDateOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
        if (planDateOnly < fromDateOnly) return false;
    }
    if (dateTo) {
        const toDateOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
        if (planDateOnly > toDateOnly) return false;
    }
    return true;
}).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Show loading state while waiting for authentication
    if (authLoading) {
        return (
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Typography variant="h6" color="text.secondary">
                        Authenticating...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Show message if not authenticated
    if (!isAuthenticated) {
        return (
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Typography variant="h6" color="error">
                        Authentication required. Please log in.
                    </Typography>
                </Box>
            </Container>
        );
    }

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
                
                {!isMobile && (
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
                )}
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
            commodities={commodities}
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
        
        {effectiveView === "table" ? (
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