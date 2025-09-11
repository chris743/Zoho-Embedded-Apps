import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Box,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    Typography
} from '@mui/material';
import { useViewMode } from '../../../contexts/ViewModeContext';
import {
    PlayArrow as StartIcon,
    CheckCircle as CompleteIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import { ProcessPlansApi } from '../../../api/processPlans';
import { useAuth } from '../../../contexts/AuthContext';
import { toYMD } from '../../../utils/dateUtils';
import { buildCommodityMap } from '../../../utils/commodities';
import { DayColumn } from './DayColumn';
import { HarvestPlanSelectorDialog } from './HarvestPlanSelectorDialog';
import { STATUS_LABELS } from './constants';

export function WeeklyProcessBoard({ 
    processPlans, 
    blocks, 
    pools, 
    contractors, 
    commodities, 
    onEdit, 
    onSuccess, 
    onError,
    weekStart
}) {
    const { apiClient } = useAuth();
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();
    
    // Determine if we should use mobile layout
    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);
    
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
    
    const sevenDays = useCallback((start) => {
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [addDays]);
    
    const [buckets, setBuckets] = useState({});
    const [, setIsDragging] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProcessPlan, setSelectedProcessPlan] = useState(null);
    const [harvestPlanDialog, setHarvestPlanDialog] = useState({ open: false, targetDate: null });

    const processPlansApi = useMemo(() => ProcessPlansApi(apiClient), [apiClient]);

    // Create lookup maps
    const blockMap = useMemo(() => {
        const map = new Map();
        blocks.forEach(block => {
            const key = `${block.source_database}:${block.GABLOCKIDX}`;
            map.set(key, block);
        });
        return map;
    }, [blocks]);

    const poolMap = useMemo(() => {
        const map = new Map();
        pools.forEach(pool => {
            map.set(pool.id, pool);
        });
        return map;
    }, [pools]);

    const contractorMap = useMemo(() => {
        const map = new Map();
        contractors.forEach(contractor => {
            map.set(contractor.id, contractor);
        });
        return map;
    }, [contractors]);

    const commodityMap = useMemo(() => {
        return buildCommodityMap(commodities);
    }, [commodities]);

    // Build buckets function
    const buildBuckets = useCallback((plans, dayKeys) => {
        const buckets = {};
        
        dayKeys.forEach(day => {
            buckets[day] = [];
        });
        
        plans.forEach(plan => {
            let runDate;
            try {
                // Try direct string parsing first
                if (typeof plan.run_date === 'string' && plan.run_date.includes('T')) {
                    runDate = plan.run_date.split('T')[0]; // Take just the date part
                } else {
                    // Fallback to Date object conversion
                    const dateObj = new Date(plan.run_date);
                    if (!isNaN(dateObj.getTime())) {
                        runDate = toYMD(dateObj);
                    }
                }
            } catch (error) {
                console.warn('Date parsing error for plan:', plan.id, plan.run_date, error);
                return; // Skip this plan
            }
            
            if (plan.run_date && runDate) {
                if (buckets[runDate]) {
                    buckets[runDate].push(plan);
                }
            }
        });
        
        // Sort each day's plans by row_order
        Object.keys(buckets).forEach(day => {
            buckets[day].sort((a, b) => (a.row_order || 0) - (b.row_order || 0));
        });
        
        return buckets;
    }, []);

    // Memoize dayKeys to prevent recreating array on every render
    const dayKeys = useMemo(() => {
        const start = startOfWeek(weekStart || new Date());
        const days = sevenDays(start);
        const keys = days.map(day => toYMD(day));
        return keys;
    }, [weekStart, startOfWeek, sevenDays]);

    // Update buckets when process plans change
    useEffect(() => {
        const newBuckets = buildBuckets(processPlans || [], dayKeys);
        setBuckets(newBuckets);
    }, [processPlans, buildBuckets, dayKeys]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleDragEnd = useCallback(async (result) => {
        setIsDragging(false);
        
        if (!result.destination) return;
        
        const { source, destination, draggableId } = result;
        
        if (source.droppableId === destination.droppableId && 
            source.index === destination.index) {
            return;
        }
        
        const sourceDay = source.droppableId;
        const destDay = destination.droppableId;
        const planId = draggableId;
        
        // Find the plan
        const plan = processPlans.find(p => p.id === planId);
        if (!plan) return;
        
        // Store original buckets for potential revert
        const originalBuckets = { ...buckets };
        
        // Optimistic update - immediately update UI
        setBuckets(prev => {
            const newBuckets = { ...prev };
            const sourcePlans = [...(prev[sourceDay] || [])];
            const destPlans = sourceDay === destDay ? sourcePlans : [...(prev[destDay] || [])];
            
            // Remove from source
            const movedPlan = sourcePlans.splice(source.index, 1)[0];
            if (!movedPlan) return prev;
            
            // Update run_date if moving to different day
            if (sourceDay !== destDay) {
                movedPlan.run_date = new Date(destDay).toISOString();
            }
            
            // Insert at destination
            destPlans.splice(destination.index, 0, movedPlan);
            
            // Update row_order for both arrays
            sourcePlans.forEach((plan, index) => {
                plan.row_order = index;
            });
            destPlans.forEach((plan, index) => {
                plan.row_order = index;
            });
            
            newBuckets[sourceDay] = sourcePlans;
            if (sourceDay !== destDay) {
                newBuckets[destDay] = destPlans;
            }
            
            return newBuckets;
        });
        
        // Persist to server
        try {
            if (sourceDay === destDay) {
                // Same day reordering
                const dayPlans = buckets[sourceDay] || [];
                const sortedPlans = [...dayPlans].sort((a, b) => (a.row_order || 0) - (b.row_order || 0));
                
                const movedPlanIndex = sortedPlans.findIndex(p => p.id === planId);
                if (movedPlanIndex !== -1) {
                    const [movedPlan] = sortedPlans.splice(movedPlanIndex, 1);
                    sortedPlans.splice(destination.index, 0, movedPlan);
                    
                    const updatePromises = sortedPlans.map((plan, index) => 
                        processPlansApi.update(plan.id, {
                            row_order: index
                        })
                    );
                    
                    await Promise.all(updatePromises);
                }
            } else {
                // Different day - update run_date and reorder both days
                const sourcePlans = (buckets[sourceDay] || []).filter(p => p.id !== planId);
                const destPlans = [...(buckets[destDay] || [])];
                const movedPlan = processPlans.find(p => p.id === planId);
                
                if (movedPlan) {
                    destPlans.splice(destination.index, 0, movedPlan);
                    
                    const sourceUpdatePromises = sourcePlans.map((plan, index) => 
                        processPlansApi.update(plan.id, {
                            row_order: index
                        })
                    );
                    
                    const newRunDate = new Date(destDay);
                    const destUpdatePromises = destPlans.map((plan, index) => 
                        processPlansApi.update(plan.id, {
                            run_date: plan.id === planId ? newRunDate.toISOString() : plan.run_date,
                            row_order: index
                        })
                    );
                    
                    await Promise.all([...sourceUpdatePromises, ...destUpdatePromises]);
                }
            }
        } catch (err) {
            // Revert optimistic update on error
            setBuckets(originalBuckets);
            onError(err?.response?.data?.message || 'Failed to move process plan');
        }
    }, [processPlans, processPlansApi, onError, buckets]);

    const handleMenuOpen = (event, processPlan) => {
        setAnchorEl(event.currentTarget);
        setSelectedProcessPlan(processPlan);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedProcessPlan(null);
    };

    const handleStatusChange = async (status) => {
        if (!selectedProcessPlan) return;
        
        try {
            await processPlansApi.updateStatus(selectedProcessPlan.id, status);
            onSuccess(`Process plan status updated to ${STATUS_LABELS[status]}`);
            handleMenuClose();
        } catch (err) {
            onError(err?.response?.data?.message || 'Failed to update status');
        }
    };

    const handleStartProcess = async () => {
        if (!selectedProcessPlan) return;
        
        try {
            console.log('Starting process for ID:', selectedProcessPlan.id);
            const response = await processPlansApi.startProcess(selectedProcessPlan.id);
            console.log('Start process response:', response);
            onSuccess('Process started successfully');
            handleMenuClose();
        } catch (err) {
            console.error('Start process error:', err);
            onError(err?.response?.data?.message || 'Failed to start process');
        }
    };

    const handleCompleteProcess = async () => {
        if (!selectedProcessPlan) return;
        
        try {
            console.log('Completing process for ID:', selectedProcessPlan.id);
            const response = await processPlansApi.completeProcess(selectedProcessPlan.id);
            console.log('Complete process response:', response);
            onSuccess('Process completed successfully');
            handleMenuClose();
        } catch (err) {
            console.error('Complete process error:', err);
            onError(err?.response?.data?.message || 'Failed to complete process');
        }
    };

    const handleBringFromHarvestPlans = (displayDate, actualDay) => {
        // Use the actual day key (not the display date) for process plan creation
        const actualDate = new Date(actualDay);
        console.log('🗓️ Date mapping for harvest plan creation:', {
            displayDate: displayDate?.toISOString().split('T')[0],
            actualDay,
            actualDate: actualDate?.toISOString().split('T')[0],
            note: 'Using actualDate for process plan creation'
        });
        setHarvestPlanDialog({ open: true, targetDate: actualDate });
    };

    const handleHarvestPlanDialogClose = () => {
        setHarvestPlanDialog({ open: false, targetDate: null });
    };

    const handleSelectHarvestPlans = async (selectedHarvestPlans, targetDate) => {
        try {
            console.log('🔄 Starting process plan creation from harvest plans:', {
                selectedCount: selectedHarvestPlans.length,
                targetDate: targetDate?.toISOString().split('T')[0],
                selectedPlans: selectedHarvestPlans.map(plan => ({
                    id: plan.id,
                    date: plan.date,
                    grower_block_id: plan.grower_block_id,
                    bins: plan.bins,
                    planned_bins: plan.planned_bins,
                    deliver_to: plan.deliver_to,
                    pool_id: plan.pool_id,
                    notes_general: plan.notes_general
                }))
            });

            const processPlanPromises = selectedHarvestPlans.map((harvestPlan, index) => {
                // Convert harvest plan to process plan
                const processPlanData = {
                    source_database: 'COBBLESTONE', // Default source database
                    gablockidx: harvestPlan.grower_block_id,
                    bins: harvestPlan.bins || harvestPlan.planned_bins || 0,
                    run_date: new Date(targetDate).toISOString(),
                    pick_date: harvestPlan.date ? new Date(harvestPlan.date).toISOString() : new Date(targetDate).toISOString(),
                    location: harvestPlan.deliver_to || '',
                    pool: harvestPlan.pool_id ? String(harvestPlan.pool_id) : '',
                    contractor: harvestPlan.contractor_id ? String(harvestPlan.contractor_id) : '',
                    notes: harvestPlan.notes_general || '',
                    run_status: 'pending',
                    batch_id: ''
                };
                
                console.log(`📝 Creating process plan ${index + 1}/${selectedHarvestPlans.length}:`, {
                    harvestPlanId: harvestPlan.id,
                    processPlanData
                });
                
                return processPlansApi.create(processPlanData);
            });

            console.log('🚀 Executing batch creation of process plans...');
            const results = await Promise.all(processPlanPromises);
            
            console.log('✅ Process plans created successfully:', {
                count: results.length,
                results: results.map((result, index) => ({
                    index: index + 1,
                    status: result.status,
                    data: result.data
                }))
            });

            onSuccess(`Created ${selectedHarvestPlans.length} process plan${selectedHarvestPlans.length !== 1 ? 's' : ''} from harvest plans`);
        } catch (err) {
            console.error('❌ Failed to create process plans from harvest plans:', {
                error: err,
                message: err?.message,
                response: err?.response,
                responseData: err?.response?.data,
                responseStatus: err?.response?.status,
                responseStatusText: err?.response?.statusText
            });
            onError(err?.response?.data?.message || err?.message || 'Failed to create process plans from harvest plans');
        }
    };

    return (
        <Box sx={{ p: isMobile ? 1 : 2, width: '100%', overflow: 'hidden' }}>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {isMobile ? (
                    // Mobile: Vertical stack of day columns
                    <Box sx={{ 
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'primary.200'
                    }}>
                        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'primary.main' }}>
                            📱 Mobile View - Weekly Process Plans
                        </Typography>
                        <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
                        {dayKeys.map(day => {
                            const dayDate = new Date(day);
                            // Offset the display date by +1 day to match actual associated dates
                            const displayDate = addDays(dayDate, 1);
                            const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6;
                            
                            return (
                                <DayColumn
                                    key={day}
                                    day={day}
                                    dayDate={displayDate}
                                    plans={buckets[day] || []}
                                    blockMap={blockMap}
                                    poolMap={poolMap}
                                    contractorMap={contractorMap}
                                    commodityMap={commodityMap}
                                    onEdit={onEdit}
                                    onMenuOpen={handleMenuOpen}
                                    isWeekend={isWeekend}
                                    onBringFromHarvestPlans={(displayDate) => handleBringFromHarvestPlans(displayDate, day)}
                                    isMobile={isMobile}
                                />
                            );
                        })}
                        </Stack>
                    </Box>
                ) : (
                    // Desktop: Horizontal row of day columns
                    <Stack direction="row" spacing={2} sx={{ pb: 2, width: '100%' }}>
                        {dayKeys.map(day => {
                            const dayDate = new Date(day);
                            // Offset the display date by +1 day to match actual associated dates
                            const displayDate = addDays(dayDate, 1);
                            const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6;
                            
                            return (
                                <DayColumn
                                    key={day}
                                    day={day}
                                    dayDate={displayDate}
                                    plans={buckets[day] || []}
                                    blockMap={blockMap}
                                    poolMap={poolMap}
                                    contractorMap={contractorMap}
                                    commodityMap={commodityMap}
                                    onEdit={onEdit}
                                    onMenuOpen={handleMenuOpen}
                                    isWeekend={isWeekend}
                                    onBringFromHarvestPlans={(displayDate) => handleBringFromHarvestPlans(displayDate, day)}
                                    isMobile={isMobile}
                                />
                            );
                        })}
                    </Stack>
                )}
            </DragDropContext>

            {/* Context Menu */}
            <Dialog open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <DialogTitle>Process Plan Actions</DialogTitle>
                <DialogContent>
                    <Stack spacing={1}>
                        <Button
                            startIcon={<StartIcon />}
                            onClick={handleStartProcess}
                            disabled={selectedProcessPlan?.run_status === 'in_progress'}
                        >
                            Start Process
                        </Button>
                        <Button
                            startIcon={<CompleteIcon />}
                            onClick={handleCompleteProcess}
                            disabled={selectedProcessPlan?.run_status === 'completed'}
                        >
                            Complete Process
                        </Button>
                        <Button
                            startIcon={<CancelIcon />}
                            onClick={() => handleStatusChange('cancelled')}
                            disabled={selectedProcessPlan?.run_status === 'cancelled'}
                        >
                            Cancel Process
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleMenuClose}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Harvest Plan Selector Dialog */}
            <HarvestPlanSelectorDialog
                open={harvestPlanDialog.open}
                onClose={handleHarvestPlanDialogClose}
                targetDate={harvestPlanDialog.targetDate}
                onSelectPlans={handleSelectHarvestPlans}
                blocks={blocks}
                contractors={contractors}
                pools={pools}
            />
        </Box>
    );
}
