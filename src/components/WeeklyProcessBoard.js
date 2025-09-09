import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack
} from '@mui/material';
import {
    PlayArrow as StartIcon,
    CheckCircle as CompleteIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import { ProcessPlansApi } from '../api/processPlans';
import { useAuth } from '../contexts/AuthContext';
import { startOfWeek, sevenDays, addDays, toYMD } from '../utils/dateUtils';
import { createBlockMap, createPoolMap, createContractorMap, createCommodityMap, enrichProcessPlan } from '../utils/dataUtils';
import { ProcessPlanDayColumn } from './ProcessPlanDayColumn';

const STATUS_COLORS = {
    pending: 'default',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error'
};

const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
};

export function WeeklyProcessBoard({ 
    processPlans, 
    blocks, 
    pools, 
    contractors, 
    commodities, 
    onEdit, 
    onSuccess, 
    onError,
    weekStart,
    onProcessPlanUpdate // New prop to update the plan in parent state
}) {
    const { apiClient } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [selectedProcessPlan, setSelectedProcessPlan] = useState(null);
    const [buckets, setBuckets] = useState({});
    const [isOptimisticallyUpdating, setIsOptimisticallyUpdating] = useState(false);

    const processPlansApi = useMemo(() => ProcessPlansApi(apiClient), [apiClient]);

    // Create lookup maps using utilities
    const blockMap = useMemo(() => createBlockMap(blocks), [blocks]);
    const poolMap = useMemo(() => createPoolMap(pools), [pools]);
    const contractorMap = useMemo(() => createContractorMap(contractors), [contractors]);
    const commodityMap = useMemo(() => createCommodityMap(commodities), [commodities]);
    
    const lookupMaps = useMemo(() => ({
        blocks: blockMap,
        pools: poolMap,
        contractors: contractorMap,
        commodities: commodityMap
    }), [blockMap, poolMap, contractorMap, commodityMap]);

    // Get current week days using Sunday start logic
    const currentWeekStart = useMemo(() => {
        const date = weekStart || new Date();
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = d.getDate() - day; // Sunday start (no adjustment needed)
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        console.log('WeeklyProcessBoard currentWeekStart:', d, 'weekStart input:', date);
        return d;
    }, [weekStart]);
    
    const dayKeys = useMemo(() => {
        return sevenDays(currentWeekStart).map(day => toYMD(day));
    }, [currentWeekStart]);
    
    // Build buckets from process plans
    useEffect(() => {
        // Skip rebuilding buckets if we're in the middle of an optimistic update
        if (isOptimisticallyUpdating) {
            return;
        }
        
        const newBuckets = {};
        
        // Initialize empty buckets for each day
        dayKeys.forEach(day => {
            newBuckets[day] = [];
        });
        
        // Sort plans by run_date, then row_order
        const sortedPlans = [...(processPlans || [])].sort((a, b) => {
            const dateA = new Date(a.run_date || 0);
            const dateB = new Date(b.run_date || 0);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            return (a.row_order || 0) - (b.row_order || 0);
        });
        
        // Distribute plans to appropriate days with enriched data
        sortedPlans.forEach(plan => {
            const runDate = plan.run_date ? toYMD(new Date(plan.run_date)) : null;
            if (runDate && newBuckets[runDate]) {
                newBuckets[runDate].push(enrichProcessPlan(plan, lookupMaps));
            }
        });
        
        setBuckets(newBuckets);
    }, [processPlans, lookupMaps, dayKeys, isOptimisticallyUpdating]);

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
        const plan = processPlans.find(p => String(p.id) === String(planId));
        if (!plan) return;
        
        // Set flag to prevent useEffect rebuild
        setIsOptimisticallyUpdating(true);
        
        // Optimistic update - immediately update buckets
        const originalBuckets = JSON.parse(JSON.stringify(buckets)); // Deep copy for revert
        const newRunDate = new Date(destDay);
        
        // Update buckets optimistically
        const updatedBuckets = { ...buckets };
        
        // Remove from source
        const sourceCards = [...(updatedBuckets[sourceDay] || [])];
        const movedCard = sourceCards[source.index];
        if (!movedCard) return;
        
        sourceCards.splice(source.index, 1);
        updatedBuckets[sourceDay] = sourceCards;
        
        // Add to destination with updated data
        const destCards = sourceDay === destDay ? sourceCards : [...(updatedBuckets[destDay] || [])];
        const updatedCard = enrichProcessPlan({
            ...plan,
            run_date: newRunDate.toISOString(),
            row_order: destination.index
        }, lookupMaps);
        
        destCards.splice(destination.index, 0, updatedCard);
        updatedBuckets[destDay] = destCards;
        
        // Apply optimistic update
        setBuckets(updatedBuckets);
        
        // Update on server
        try {
            await processPlansApi.update(planId, {
                run_date: newRunDate.toISOString(),
                row_order: destination.index
            });
            
            // Update parent state directly to avoid reload
            if (onProcessPlanUpdate) {
                onProcessPlanUpdate(planId, {
                    run_date: newRunDate.toISOString(),
                    row_order: destination.index
                });
            }
            
            // Show success message without triggering reload
            if (onSuccess) onSuccess('Process plan moved successfully', false); // false = don't reload
        } catch (err) {
            // Revert optimistic update on error
            setBuckets(originalBuckets);
            onError(err?.response?.data?.message || 'Failed to move process plan');
        } finally {
            // Reset flag
            setIsOptimisticallyUpdating(false);
        }
    }, [buckets, processPlans, processPlansApi, lookupMaps, onSuccess, onError, onProcessPlanUpdate]);

    const handleMenuOpen = useCallback((processPlan) => {
        setSelectedProcessPlan(processPlan);
    }, []);

    const handleMenuClose = useCallback(() => {
        setSelectedProcessPlan(null);
    }, []);

    const handleStatusChange = useCallback(async (status) => {
        if (!selectedProcessPlan) return;
        
        setIsOptimisticallyUpdating(true);
        
        try {
            await processPlansApi.updateStatus(selectedProcessPlan.id, status);
            
            // Update parent state directly
            if (onProcessPlanUpdate) {
                onProcessPlanUpdate(selectedProcessPlan.id, { run_status: status });
            }
            
            onSuccess(`Process plan status updated to ${STATUS_LABELS[status]}`, false);
            handleMenuClose();
        } catch (err) {
            onError(err?.response?.data?.message || 'Failed to update status');
        } finally {
            setIsOptimisticallyUpdating(false);
        }
    }, [selectedProcessPlan, processPlansApi, onSuccess, onError, handleMenuClose, onProcessPlanUpdate]);

    const handleStartProcess = useCallback(async () => {
        if (!selectedProcessPlan) return;
        
        setIsOptimisticallyUpdating(true);
        
        try {
            await processPlansApi.startProcess(selectedProcessPlan.id);
            
            // Update parent state directly
            if (onProcessPlanUpdate) {
                onProcessPlanUpdate(selectedProcessPlan.id, { run_status: 'in_progress' });
            }
            
            onSuccess('Process started successfully', false);
            handleMenuClose();
        } catch (err) {
            onError(err?.response?.data?.message || 'Failed to start process');
        } finally {
            setIsOptimisticallyUpdating(false);
        }
    }, [selectedProcessPlan, processPlansApi, onSuccess, onError, handleMenuClose, onProcessPlanUpdate]);

    const handleCompleteProcess = useCallback(async () => {
        if (!selectedProcessPlan) return;
        
        setIsOptimisticallyUpdating(true);
        
        try {
            await processPlansApi.completeProcess(selectedProcessPlan.id);
            
            // Update parent state directly
            if (onProcessPlanUpdate) {
                onProcessPlanUpdate(selectedProcessPlan.id, { run_status: 'completed' });
            }
            
            onSuccess('Process completed successfully', false);
            handleMenuClose();
        } catch (err) {
            onError(err?.response?.data?.message || 'Failed to complete process');
        } finally {
            setIsOptimisticallyUpdating(false);
        }
    }, [selectedProcessPlan, processPlansApi, onSuccess, onError, handleMenuClose, onProcessPlanUpdate]);

    const dayObjects = useMemo(() => sevenDays(currentWeekStart), [currentWeekStart]);

    return (
        <Box sx={{ p: 2 }}>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2 }}>
                    {dayObjects.map((dateObj, index) => {
                        const ymd = toYMD(dateObj);
                        const headerDateObj = addDays(dateObj, -1); // Offset header by -1 day
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                        return (
                            <ProcessPlanDayColumn
                                key={ymd}
                                ymd={ymd}
                                dateObj={headerDateObj}
                                cards={buckets[ymd] || []}
                                onEdit={onEdit}
                                onView={handleMenuOpen}
                                isWeekend={isWeekend}
                            />
                        );
                    })}
                </Box>
            </DragDropContext>

            {/* Action Menu */}
            <Dialog
                open={Boolean(selectedProcessPlan)}
                onClose={handleMenuClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Process Plan Actions</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<StartIcon />}
                            onClick={() => handleStatusChange('in_progress')}
                            fullWidth
                        >
                            Set to In Progress
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CompleteIcon />}
                            onClick={() => handleStatusChange('completed')}
                            fullWidth
                        >
                            Set to Completed
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => handleStatusChange('cancelled')}
                            fullWidth
                        >
                            Set to Cancelled
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<StartIcon />}
                            onClick={handleStartProcess}
                            fullWidth
                        >
                            Start Process
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CompleteIcon />}
                            onClick={handleCompleteProcess}
                            fullWidth
                        >
                            Complete Process
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleMenuClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
