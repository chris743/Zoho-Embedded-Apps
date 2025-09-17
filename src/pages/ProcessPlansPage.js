import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    ViewList as TableViewIcon,
    ViewModule as CardViewIcon,
    Add as AddIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { ProcessPlansApi } from '../api/processPlans';
import { BlocksApi } from '../api/blocks';
import { PoolsApi } from '../api/pools';
import { ContractorsApi } from '../api/contractors';
import { CommoditiesApi } from '../api/commodities';
import { useAuth } from '../contexts/AuthContext';
import { ProcessPlansTable } from '../components/tables/ProcessPlansTable';
import { WeeklyProcessBoard } from '../components/planners/processPlanner';
import { ProcessPlanDialog } from '../components/dialogs/ProcessPlanDialog';
import { DateRangePicker } from '../components/DateRangePicker';
import { WeekPicker } from '../components/WeekPicker';
import { initializeCommodityColors } from '../utils/theme';


export default function ProcessPlansPage() {
    const { apiClient } = useAuth();
    
    // State
    const [view, setView] = useState('table');
    const [processPlans, setProcessPlans] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [pools, setPools] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [commodities, setCommodities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Date range state - default to today only
    const [dateFrom, setDateFrom] = useState(new Date());
    const [dateTo, setDateTo] = useState(new Date()); // Default to today only
    
    // Week state for weekly view
    const [weekStart, setWeekStart] = useState(new Date());
    
    // Helper functions for week calculations (Sunday start)
    const startOfWeek = useCallback((date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = d.getDate() - day; // Sunday start (no adjustment needed)
        return new Date(d.setDate(diff));
    }, []);
    
    const addDays = useCallback((date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }, []);
    
    const getWeekRange = useCallback((weekStartDate) => {
        const start = startOfWeek(weekStartDate);
        const end = addDays(start, 6);
        return { start, end };
    }, [startOfWeek, addDays]);
    
    // Filters
    const [hideCompleted, setHideCompleted] = useState(false);
    
    // Dialog state
    const [processPlanDialog, setProcessPlanDialog] = useState({ open: false, processPlan: null, isEdit: false });
    
    // API instances
    const processPlansApi = useMemo(() => ProcessPlansApi(apiClient), [apiClient]);
    const blocksApi = useMemo(() => BlocksApi(apiClient), [apiClient]);
    const poolsApi = useMemo(() => PoolsApi(apiClient), [apiClient]);
    const contractorsApi = useMemo(() => ContractorsApi(apiClient), [apiClient]);
    const commoditiesApi = useMemo(() => CommoditiesApi(apiClient), [apiClient]);

    // Separate filtering for table view (uses date range picker)
    const filteredTablePlans = useMemo(() => {
        const filtered = processPlans.filter(plan => {
            if (!plan.run_date) return false;
            const planDate = new Date(plan.run_date);
            const planDateOnly = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
            
            if (dateFrom) {
                const fromDateOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
                if (planDateOnly < fromDateOnly) return false;
            }
            if (dateTo) {
                const toDateOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
                if (planDateOnly > toDateOnly) return false;
            }
            if (hideCompleted && plan.run_status === 'completed') return false;
            return true;
        }).sort((a, b) => (a.run_date || '').localeCompare(b.run_date || ''));
        
        console.log('ProcessPlansPage: Table filtering applied:', {
            totalPlans: processPlans.length,
            filteredPlans: filtered.length,
            dateFrom: dateFrom?.toISOString().split('T')[0],
            dateTo: dateTo?.toISOString().split('T')[0]
        });
        
        return filtered;
    }, [processPlans, dateFrom, dateTo, hideCompleted]);

    // Separate filtering for weekly view (uses week range)
    const filteredWeeklyPlans = useMemo(() => {
        const weekRange = getWeekRange(weekStart);
        const fromDate = weekRange.start;
        const toDate = weekRange.end;
        
        const filtered = processPlans.filter(plan => {
            if (!plan.run_date) return false;
            const planDate = new Date(plan.run_date);
            const planDateOnly = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
            
            if (fromDate) {
                const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
                if (planDateOnly < fromDateOnly) return false;
            }
            if (toDate) {
                const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
                if (planDateOnly > toDateOnly) return false;
            }
            if (hideCompleted && plan.run_status === 'completed') return false;
            return true;
        }).sort((a, b) => (a.run_date || '').localeCompare(b.run_date || ''));
        
        console.log('ProcessPlansPage: Weekly filtering applied:', {
            totalPlans: processPlans.length,
            filteredPlans: filtered.length,
            fromDate: fromDate?.toISOString().split('T')[0],
            toDate: toDate?.toISOString().split('T')[0],
            weekStart: weekStart?.toISOString().split('T')[0]
        });
        
        return filtered;
    }, [processPlans, weekStart, getWeekRange, hideCompleted]);

    // Load data
    const loadProcessPlans = async () => {
        setLoading(true);
        try {
            const params = {
                take: 10000,
                orderBy: 'run_date asc, row_order asc'
            };
            
            // No server-side filters needed - we'll filter client-side
            
            console.log('ProcessPlansPage: Loading process plans with params:', params);
            
            const response = await processPlansApi.list(params);
            const data = Array.isArray(response.data) ? response.data : 
                       response.data?.items || response.data?.value || [];
            
            console.log('ProcessPlansPage: Received process plans:', {
                count: data.length,
                firstFew: data.slice(0, 3).map(p => ({
                    id: p.id,
                    run_date: p.run_date,
                    block_name: p.block?.name
                }))
            });
            
            setProcessPlans(data);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load process plans');
        } finally {
            setLoading(false);
        }
    };

    const loadBlocks = async () => {
        try {
            const response = await blocksApi.list({ take: 10000 });
            const data = Array.isArray(response.data) ? response.data : 
                       response.data?.items || response.data?.value || [];
            setBlocks(data);
        } catch (err) {
            console.error('Failed to load blocks:', err);
        }
    };

    const loadPools = async () => {
        try {
            const response = await poolsApi.list({ take: 10000 });
            const data = Array.isArray(response.data) ? response.data : 
                       response.data?.items || response.data?.value || [];
            setPools(data);
        } catch (err) {
            console.error('Failed to load pools:', err);
        }
    };

    const loadContractors = async () => {
        try {
            const response = await contractorsApi.list({ take: 10000 });
            const data = Array.isArray(response.data) ? response.data : 
                       response.data?.items || response.data?.value || [];
            setContractors(data);
        } catch (err) {
            console.error('Failed to load contractors:', err);
        }
    };

    const loadCommodities = async () => {
        try {
            const response = await commoditiesApi.list({ take: 10000 });
            const data = Array.isArray(response.data) ? response.data : 
                       response.data?.items || response.data?.value || [];
            setCommodities(data);
            
            // Initialize commodity colors
            const commodityNames = [...new Set(data.map(c => c.name).filter(Boolean))].sort();
            initializeCommodityColors(commodityNames);
        } catch (err) {
            console.error('Failed to load commodities:', err);
        }
    };

    // Load all data on mount
    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([
                loadProcessPlans(),
                loadBlocks(),
                loadPools(),
                loadContractors(),
                loadCommodities()
            ]);
        };
        loadAll();
    }, []);

    // Reload process plans when needed
    useEffect(() => {
        loadProcessPlans();
    }, []);

    // Handlers
    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    const handleDateRangeChange = (from, to) => {
        console.log('ProcessPlansPage: Date range changed:', {
            from: from?.toISOString().split('T')[0],
            to: to?.toISOString().split('T')[0]
        });
        setDateFrom(from);
        setDateTo(to);
    };

    const handleCreateProcessPlan = () => {
        setProcessPlanDialog({ open: true, processPlan: null, isEdit: false });
    };

    const handleEditProcessPlan = (processPlan) => {
        setProcessPlanDialog({ open: true, processPlan, isEdit: true });
    };

    const handleProcessPlanDialogClose = () => {
        setProcessPlanDialog({ open: false, processPlan: null, isEdit: false });
    };

    const handleSuccess = (message, shouldReload = true) => {
        if (message) {
            setSuccess(message);
            setError('');
            setTimeout(() => setSuccess(''), 4000);
        }
        if (shouldReload) {
            loadProcessPlans(); // Refresh the list only when needed
        }
    };

    const handleError = (message) => {
        setError(message);
        setSuccess('');
    };

    const handleProcessPlanUpdate = (planId, updates) => {
        setProcessPlans(prev => prev.map(plan => 
            String(plan.id) === String(planId) 
                ? { ...plan, ...updates }
                : plan
        ));
    };

    const clearFilters = () => {
        setHideCompleted(false);
    };

    const hasActiveFilters = hideCompleted;

    return (
        <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
            {/* Header Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'background.paper', border: '1px solid #E8EBF0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Process Plans
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateProcessPlan}
                            sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            New Process Plan
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadProcessPlans}
                            disabled={loading}
                            sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                {/* View Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ToggleButtonGroup
                        value={view}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                        sx={{ borderRadius: 2 }}
                    >
                        <ToggleButton value="table" sx={{ textTransform: 'none' }}>
                            <TableViewIcon sx={{ mr: 1 }} />
                            Table View
                        </ToggleButton>
                        <ToggleButton value="column" sx={{ textTransform: 'none' }}>
                            <CardViewIcon sx={{ mr: 1 }} />
                            Week View
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Controls Section */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    {view === 'table' ? (
                        <DateRangePicker
                            from={dateFrom}
                            to={dateTo}
                            onChange={handleDateRangeChange}
                        />
                    ) : (
                        <WeekPicker
                            weekStart={weekStart}
                            onWeekChange={setWeekStart}
                        />
                    )}

                    {/* Filters */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={hideCompleted}
                                onChange={(e) => setHideCompleted(e.target.checked)}
                                size="small"
                            />
                        }
                        label="Hide Completed"
                    />

                    {hasActiveFilters && (
                        <Button
                            size="small"
                            onClick={clearFilters}
                            sx={{ textTransform: 'none' }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Main Content */}
            <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid #E8EBF0', borderRadius: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : view === 'table' ? (
                    <ProcessPlansTable
                        processPlans={filteredTablePlans}
                        blocks={blocks}
                        pools={pools}
                        contractors={contractors}
                        commodities={commodities}
                        onEdit={handleEditProcessPlan}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />
                ) : (
                    <WeeklyProcessBoard
                        processPlans={filteredWeeklyPlans}
                        blocks={blocks}
                        pools={pools}
                        contractors={contractors}
                        commodities={commodities}
                        onEdit={handleEditProcessPlan}
                        onSuccess={handleSuccess}
                        onError={handleError}
                        weekStart={weekStart}
                        onProcessPlanUpdate={handleProcessPlanUpdate}
                    />
                )}
            </Paper>

            {/* Process Plan Dialog */}
            <ProcessPlanDialog
                open={processPlanDialog.open}
                onClose={handleProcessPlanDialogClose}
                processPlan={processPlanDialog.processPlan}
                isEdit={processPlanDialog.isEdit}
                blocks={blocks}
                pools={pools}
                commodities={commodities}
                onSuccess={handleSuccess}
                onError={handleError}
            />
        </Container>
    );
}
