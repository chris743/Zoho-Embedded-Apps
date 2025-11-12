import React, { useEffect, useMemo, useState } from "react";
import { Container, Box, Typography, CircularProgress, Button, Stack, Paper, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { WeeklyPlannerBoard } from "../components/planners/WeeklyPlannerComponents/WeeklyPlannerBoard";
import { HarvestPlansApi } from "../api/harvestPlans";
import { BlocksApi } from "../api/blocks";
import { ContractorsApi } from "../api/contractors";
import { CommoditiesApi } from "../api/commodities";
import { UsersApi } from "../api/auth";
import { BinsReceivedApi } from "../api/binsReceived";
import { makeApi } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useZohoAuth } from "../utils/zohoAuth";
import { DragDropContext, Droppable, Draggable, DropResult  } from "@hello-pangea/dnd";
import DNDTESTCOMPONENT from "../components/DNDTESTCOMPONENT";
import { sevenDays, toYMD, weekdayShort } from "../utils/dateUtils";

export default function TestDragDropPage() {
    const [apiBase] = useState(() => {
        const stored = localStorage.getItem("apiBase");
        return stored || "https://api.cobblestonecloud.com/api/v1";
    });
    
    const { isAuthenticated: userAuth, loading: userLoading, token: userToken } = useAuth();
    const { isAuthenticated: zohoAuth, loading: zohoLoading, token: zohoToken } = useZohoAuth();
    
    const authToken = zohoToken || userToken || localStorage.getItem("jwt") || "";
    const isAuthenticated = zohoAuth || userAuth;
    const authLoading = zohoLoading || userLoading;
    
    const api = useMemo(() => makeApi(apiBase, authToken), [apiBase, authToken]);
    const svc = useMemo(() => HarvestPlansApi(api), [api]);
    const blocksSvc = useMemo(() => BlocksApi(api), [api]);
    const contractorSvc = useMemo(() => ContractorsApi(api), [api]);
    const commoditiesSvc = useMemo(() => CommoditiesApi(api), [api]);
    const usersSvc = useMemo(() => UsersApi(api), [api]);
    const binsReceivedSvc = useMemo(() => BinsReceivedApi(api), [api]);

    const [plans, setPlans] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [commodities, setCommodities] = useState([]);
    const [fieldRepresentatives, setFieldRepresentatives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [weekStart, setWeekStart] = useState(new Date());
    
    // BinsReceived test state
    const [binsReceived, setBinsReceived] = useState([]);
    const [binsLoading, setBinsLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const loadPlans = async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const { data } = await svc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setPlans(arr);
            console.log('Loaded plans:', arr.length);
        } catch (err) {
            console.error('Failed to load plans:', err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const loadBlocks = async () => {
        try {
            const { data } = await blocksSvc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setBlocks(arr);
        } catch (err) {
            console.warn("Blocks load failed", err);
        }
    };

    const loadContractors = async () => {
        try {
            const { data } = await contractorSvc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.values);
            setContractors(arr);
        } catch (err) {
            console.error(err);
        }
    };

    const loadCommodities = async () => {
        try {
            const { data } = await commoditiesSvc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.values);
            setCommodities(arr);
        } catch (err) {
            console.warn("commodities load failed", err);
        }
    };

    const loadFieldRepresentatives = async () => {
        try {
            const { data } = await usersSvc.list({ take: 10000 });
            const arr = Array.isArray(data) ? data : (data?.items || data?.values || data?.$values);
            const fieldReps = arr.filter(user => user.role === 'fieldrep');
            setFieldRepresentatives(fieldReps);
        } catch (err) {
            console.warn("Field representatives load failed", err);
        }
    };

    const loadBinsReceived = async () => {
        setBinsLoading(true);
        try {
            const params = {
                receiveDateFrom: dateFrom,
                receiveDateTo: dateTo,
                take: 1000
            };
            
            const { data } = await binsReceivedSvc.list(params);
            const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || Object.values(data || {}));
            setBinsReceived(arr);
            console.log('Loaded bins received:', arr.length, arr);
        } catch (err) {
            console.error('Failed to load bins received:', err);
            setBinsReceived([]);
        } finally {
            setBinsLoading(false);
        }
    };

    const handlePlanUpdate = (planId, updates) => {
        setPlans(prev => prev.map(plan =>
            String(plan.id) === String(planId)
                ? {
                    ...plan,
                    ...updates,
                    date: updates.run_date || updates.date || plan.date
                }
                : plan
        ));
    };

    const handleEdit = (plan) => {
        console.log('Edit plan:', plan);
    };

    const handleView = (plan) => {
        console.log('View plan:', plan);
    };

    const handleWeekBack = () => {
        setWeekStart(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() - 7);
            return newDate;
        });
    };

    const handleWeekForward = () => {
        setWeekStart(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + 7);
            return newDate;
        });
    };

    const handleCurrentWeek = () => {
        setWeekStart(new Date());
    };

    const getCurrentWeekStart = useMemo(() => {
        const date = weekStart || new Date();
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = d.getDate() - day; // Sunday start (no adjustment needed)
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [weekStart]);

    const daykeys = useMemo(() => {
        return sevenDays(getCurrentWeekStart).map(day => toYMD(day));
    }, [getCurrentWeekStart]);

    const columns = useMemo(() => {
        const days = sevenDays(getCurrentWeekStart);
        return days.map((day, index) => {
            const dayKey = toYMD(day);
            const dayName = weekdayShort(day);
            return {
                id: dayKey,
                title: dayName,
                date: dayKey
            };
        });
    }, [getCurrentWeekStart]);

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            console.log('Loading test page data...');
            loadPlans();
            loadBlocks();
            loadContractors();
            loadCommodities();
            loadFieldRepresentatives();
        }
    }, [isAuthenticated, authLoading]);

    if (authLoading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Authenticating...</Typography>
                </Box>
            </Container>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container>
                <Box sx={{ p: 4 }}>
                    <Typography>Please authenticate first</Typography>
                </Box>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading plans...</Typography>
                </Box>
            </Container>
        );
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Test Page
            </Typography>

            {/* BinsReceived Test Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    BinsReceived API Test
                </Typography>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            label="Date From"
                            size="small"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                        />
                        <TextField
                            label="Date To"
                            size="small"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                        />
                        <Button variant="contained" onClick={loadBinsReceived} disabled={binsLoading}>
                            {binsLoading ? <CircularProgress size={20} /> : "Load Receivings"}
                        </Button>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Results: {binsReceived.length} items
                    </Typography>
                </Stack>
                
                {binsReceived.length > 0 && (
                    <TableContainer sx={{ mt: 3, maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Commodity</TableCell>
                                        <TableCell>Style</TableCell>
                                        <TableCell>WH Desc</TableCell>
                                        <TableCell>Block ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Receive Date</TableCell>
                                        <TableCell>Qty</TableCell>
                                        <TableCell>Pool ID</TableCell>
                                        <TableCell>Source DB</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {binsReceived.map((bin, index) => {
                                        // Handle both camelCase (JSON) and PascalCase property names
                                        const commodity = bin.Commodity ?? bin.commodity;
                                        const style = bin.Style ?? bin.style;
                                        const whDesc = bin.WHDesc ?? bin.whDesc;
                                        const blockID = bin.blockID;
                                        const name = bin.NAME ?? bin.name;
                                        const receiveDate = bin.ReceiveDate ?? bin.receiveDate;
                                        const recvQnt = bin.RecvQnt ?? bin.recvQnt;
                                        const poolID = bin.poolID;
                                        const sourceDatabase = bin.source_database;
                                        
                                        return (
                                            <TableRow key={index} hover>
                                                <TableCell>{commodity || "-"}</TableCell>
                                                <TableCell>{style || "-"}</TableCell>
                                                <TableCell>{whDesc || "-"}</TableCell>
                                                <TableCell>{blockID || "-"}</TableCell>
                                                <TableCell>{name || "-"}</TableCell>
                                                <TableCell>{formatDate(receiveDate)}</TableCell>
                                                <TableCell>{recvQnt ?? "-"}</TableCell>
                                                <TableCell>{poolID || "-"}</TableCell>
                                                <TableCell>
                                                    <Chip label={sourceDatabase} size="small" />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Original Drag & Drop Section */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Drag & Drop Test
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleWeekBack}
                    >
                        ← Previous Week
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCurrentWeek}
                    >
                        Current Week
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={handleWeekForward}
                    >
                        Next Week →
                    </Button>
                </Stack>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Plans loaded: {plans.length}
                </Typography>
                
                <DNDTESTCOMPONENT 
                    plans={plans} 
                    blocks={blocks} 
                    contractors={contractors} 
                    commodities={commodities} 
                    fieldRepresentatives={fieldRepresentatives} 
                    columns={columns}
                    svc={svc}
                    onPlanUpdate={handlePlanUpdate}
                    onRefresh={() => loadPlans(false)}
                />
            </Paper>
        </Container>
    );
}

