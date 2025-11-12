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
import { useViewMode } from '../../../../contexts/ViewModeContext';
import {
    PlayArrow as StartIcon,
    CheckCircle as CompleteIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { DragDropContext } from '@hello-pangea/dnd';
import { ProcessPlansApi } from '../../../../api/processPlans';
import { useAuth } from '../../../../contexts/AuthContext';
import { toYMD } from '../../../../utils/dateUtils';
import { buildCommodityMap } from '../../../../utils/commodities';
import { WeeklyPlanDayColumn } from './WeeklyPlanDayColumn';
import { HarvestPlanSelectorDialog } from '../../processPlanner/HarvestPlanSelectorDialog';
import { STATUS_LABELS } from './planStatus';

export function WeeklyPlanBoard({
    plans,
    processPlans,
    blocks,
    pools,
    contractors,
    commodities,
    onEdit,
    onSuccess,
    onError,
    weekStart,
    apiService,
    onPlanUpdate,
    onProcessPlanUpdate,
    fieldMapping = { dateField: 'run_date', hasRowOrder: true },
    enableStatusActions = true,
    enableHarvestPlanImport = true
}) {
    const { apiClient } = useAuth();
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();

    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);

    const startOfWeek = useCallback((date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
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
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [harvestPlanDialog, setHarvestPlanDialog] = useState({ open: false, targetDate: null });

    const defaultApi = useMemo(() => ProcessPlansApi(apiClient), [apiClient]);
    const boardApi = apiService || defaultApi;

    const resolvedPlans = useMemo(() => plans ?? processPlans ?? [], [plans, processPlans]);
    const planUpdateHandler = onPlanUpdate ?? onProcessPlanUpdate;

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

    const buildBuckets = useCallback((inputPlans, dayKeys) => {
        const buckets = {};

        dayKeys.forEach(day => {
            buckets[day] = [];
        });

        inputPlans.forEach(plan => {
            let runDate;
            try {
                if (typeof plan.run_date === 'string' && plan.run_date.includes('T')) {
                    runDate = plan.run_date.split('T')[0];
                } else {
                    const dateObj = new Date(plan.run_date);
                    if (!isNaN(dateObj.getTime())) {
                        runDate = toYMD(dateObj);
                    }
                }
            } catch (error) {
                console.warn('Date parsing error for plan:', plan.id, plan.run_date, error);
                return;
            }

            if (plan.run_date && runDate) {
                if (buckets[runDate]) {
                    buckets[runDate].push(plan);
                }
            }
        });

        Object.keys(buckets).forEach(day => {
            buckets[day].sort((a, b) => (a.row_order || 0) - (b.row_order || 0));
        });

        return buckets;
    }, []);

    const dayKeys = useMemo(() => {
        const start = startOfWeek(weekStart || new Date());
        const days = sevenDays(start);
        return days.map(day => toYMD(day));
    }, [weekStart, startOfWeek, sevenDays]);

    useEffect(() => {
        const newBuckets = buildBuckets(resolvedPlans, dayKeys);
        setBuckets(newBuckets);
    }, [resolvedPlans, buildBuckets, dayKeys]);

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

        const plan = resolvedPlans.find(p => p.id === planId);
        if (!plan) return;

        const originalBuckets = { ...buckets };

        setBuckets(prev => {
            const newBuckets = { ...prev };
            const sourcePlans = [...(prev[sourceDay] || [])];
            const destPlans = sourceDay === destDay ? sourcePlans : [...(prev[destDay] || [])];

            const movedPlan = sourcePlans.splice(source.index, 1)[0];
            if (!movedPlan) return prev;

            if (sourceDay !== destDay) {
                movedPlan.run_date = new Date(destDay).toISOString();
            }

            destPlans.splice(destination.index, 0, movedPlan);

            if (fieldMapping.hasRowOrder) {
                sourcePlans.forEach((plan, index) => {
                    plan.row_order = index;
                });
                destPlans.forEach((plan, index) => {
                    plan.row_order = index;
                });
            }

            newBuckets[sourceDay] = sourcePlans;
            if (sourceDay !== destDay) {
                newBuckets[destDay] = destPlans;
            }

            return newBuckets;
        });

        try {
            if (sourceDay === destDay && fieldMapping.hasRowOrder) {
                const dayPlans = buckets[sourceDay] || [];
                const sortedPlans = [...dayPlans].sort((a, b) => (a.row_order || 0) - (b.row_order || 0));

                const movedPlanIndex = sortedPlans.findIndex(p => p.id === planId);
                if (movedPlanIndex !== -1) {
                    const [movedPlan] = sortedPlans.splice(movedPlanIndex, 1);
                    sortedPlans.splice(destination.index, 0, movedPlan);

                    const updatePromises = sortedPlans.map((plan, index) =>
                        boardApi.update(plan.id, {
                            row_order: index
                        })
                    );

                    await Promise.all(updatePromises);
                }
            } else if (sourceDay !== destDay) {
                const newDate = new Date(destDay);
                const updateData = { [fieldMapping.dateField]: newDate.toISOString() };

                if (fieldMapping.hasRowOrder) {
                    updateData.row_order = destination.index;
                }

                await boardApi.update(planId, updateData);

                if (planUpdateHandler) {
                    planUpdateHandler(planId, updateData);
                }
            }
        } catch (err) {
            setBuckets(originalBuckets);
            onError?.(err?.response?.data?.message || 'Failed to move plan');
        }
    }, [resolvedPlans, boardApi, onError, buckets, fieldMapping, planUpdateHandler]);

    const handleMenuOpen = (event, plan) => {
        setAnchorEl(event.currentTarget);
        setSelectedPlan(plan);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPlan(null);
    };

    const handleStatusChange = async (status) => {
        if (!selectedPlan) return;

        try {
            await boardApi.updateStatus(selectedPlan.id, status);
            planUpdateHandler?.(selectedPlan.id, { run_status: status });
            onSuccess?.(`Plan status updated to ${STATUS_LABELS[status]}`);
            handleMenuClose();
        } catch (err) {
            onError?.(err?.response?.data?.message || 'Failed to update status');
        }
    };

    const handleStartProcess = async () => {
        if (!selectedPlan) return;

        try {
            const response = await boardApi.startProcess(selectedPlan.id);
            console.log('Start process response:', response);
            planUpdateHandler?.(selectedPlan.id, { run_status: 'in_progress' });
            onSuccess?.('Process started successfully');
            handleMenuClose();
        } catch (err) {
            console.error('Start process error:', err);
            onError?.(err?.response?.data?.message || 'Failed to start process');
        }
    };

    const handleCompleteProcess = async () => {
        if (!selectedPlan) return;

        try {
            const response = await boardApi.completeProcess(selectedPlan.id);
            console.log('Complete process response:', response);
            planUpdateHandler?.(selectedPlan.id, { run_status: 'completed' });
            onSuccess?.('Process completed successfully');
            handleMenuClose();
        } catch (err) {
            console.error('Complete process error:', err);
            onError?.(err?.response?.data?.message || 'Failed to complete process');
        }
    };

    const handleBringFromHarvestPlans = (displayDate, actualDay) => {
        if (!enableHarvestPlanImport) return;
        const actualDate = new Date(actualDay);
        setHarvestPlanDialog({ open: true, targetDate: actualDate });
    };

    const handleHarvestPlanDialogClose = () => {
        setHarvestPlanDialog({ open: false, targetDate: null });
    };

    const handleSelectHarvestPlans = async (selectedHarvestPlans, targetDate) => {
        try {
            const planPromises = selectedHarvestPlans.map((harvestPlan) => {
                const processPlanData = {
                    source_database: 'COBBLESTONE',
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

                return boardApi.create(processPlanData);
            });

            await Promise.all(planPromises);
            onSuccess?.(`Created ${selectedHarvestPlans.length} process plan${selectedHarvestPlans.length !== 1 ? 's' : ''} from harvest plans`);
        } catch (err) {
            onError?.(err?.response?.data?.message || err?.message || 'Failed to create process plans from harvest plans');
        }
    };

    const menuHandler = enableStatusActions ? handleMenuOpen : undefined;
    const harvestImportHandler = enableHarvestPlanImport ? handleBringFromHarvestPlans : undefined;

    return (
        <Box sx={{ p: isMobile ? 1 : 2, width: '100%', overflow: 'hidden' }}>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {isMobile ? (
                    <Box sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'primary.200'
                    }}>
                        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'primary.main' }}>
                            📱 Mobile View - Weekly Plans
                        </Typography>
                        <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
                            {dayKeys.map(day => {
                                const dayDate = new Date(day);
                                const displayDate = addDays(dayDate, 1);
                                const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6;

                                return (
                                    <WeeklyPlanDayColumn
                                        key={day}
                                        day={day}
                                        dayDate={displayDate}
                                        plans={buckets[day] || []}
                                        blockMap={blockMap}
                                        poolMap={poolMap}
                                        contractorMap={contractorMap}
                                        commodityMap={commodityMap}
                                        onEdit={onEdit}
                                    onMenuOpen={menuHandler}
                                        isWeekend={isWeekend}
                                    onBringFromHarvestPlans={harvestImportHandler ? (displayDate) => harvestImportHandler(displayDate, day) : undefined}
                                    isMobile={isMobile}
                                    showStatusActions={enableStatusActions}
                                    />
                                );
                            })}
                        </Stack>
                    </Box>
                ) : (
                    <Stack direction="row" spacing={2} sx={{ pb: 2, width: '100%' }}>
                        {dayKeys.map(day => {
                            const dayDate = new Date(day);
                            const displayDate = addDays(dayDate, 1);
                            const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6;

                            return (
                                <WeeklyPlanDayColumn
                                    key={day}
                                    day={day}
                                    dayDate={displayDate}
                                    plans={buckets[day] || []}
                                    blockMap={blockMap}
                                    poolMap={poolMap}
                                    contractorMap={contractorMap}
                                    commodityMap={commodityMap}
                                    onEdit={onEdit}
                                    onMenuOpen={menuHandler}
                                    isWeekend={isWeekend}
                                    onBringFromHarvestPlans={harvestImportHandler ? (displayDate) => harvestImportHandler(displayDate, day) : undefined}
                                    isMobile={isMobile}
                                    showStatusActions={enableStatusActions}
                                />
                            );
                        })}
                    </Stack>
                )}
            </DragDropContext>

            {enableStatusActions && (
                <Dialog open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <DialogTitle>Plan Actions</DialogTitle>
                    <DialogContent>
                        <Stack spacing={1}>
                            <Button
                                startIcon={<StartIcon />}
                                onClick={handleStartProcess}
                                disabled={selectedPlan?.run_status === 'in_progress'}
                            >
                                Start Process
                            </Button>
                            <Button
                                startIcon={<CompleteIcon />}
                                onClick={handleCompleteProcess}
                                disabled={selectedPlan?.run_status === 'completed'}
                            >
                                Complete Process
                            </Button>
                            <Button
                                startIcon={<CancelIcon />}
                                onClick={() => handleStatusChange('cancelled')}
                                disabled={selectedPlan?.run_status === 'cancelled'}
                            >
                                Cancel Process
                            </Button>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleMenuClose}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}

            {enableHarvestPlanImport && (
                <HarvestPlanSelectorDialog
                    open={harvestPlanDialog.open}
                    onClose={handleHarvestPlanDialogClose}
                    targetDate={harvestPlanDialog.targetDate}
                    onSelectPlans={handleSelectHarvestPlans}
                    blocks={blocks}
                    contractors={contractors}
                    pools={pools}
                />
            )}
        </Box>
    );
}

