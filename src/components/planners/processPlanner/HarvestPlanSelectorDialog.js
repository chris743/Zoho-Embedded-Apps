import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import { HarvestPlansApi } from '../../../api/harvestPlans';
import { useAuth } from '../../../contexts/AuthContext';
import { toYMD, addDays } from '../../../utils/dateUtils';
import { getCommodityColor, getContrastColor } from '../../../utils/theme';

export function HarvestPlanSelectorDialog({
    open,
    onClose,
    targetDate,
    onSelectPlans,
    blocks = [],
    contractors = [],
    pools = []
}) {
    const { apiClient } = useAuth();
    const [harvestPlans, setHarvestPlans] = useState([]);
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const harvestPlansApi = useMemo(() => HarvestPlansApi(apiClient), [apiClient]);

    // Create lookup maps

    const contractorMap = useMemo(() => {
        const map = new Map();
        contractors.forEach(contractor => {
            map.set(contractor.id, contractor);
        });
        return map;
    }, [contractors]);

    const poolMap = useMemo(() => {
        const map = new Map();
        pools.forEach(pool => {
            map.set(pool.id, pool);
        });
        return map;
    }, [pools]);

    // Load harvest plans for current and previous day
    useEffect(() => {
        if (!open || !targetDate) return;

        const loadHarvestPlans = async () => {
            setLoading(true);
            setError('');
            try {
                // Load all harvest plans (like the harvest planner page does)
                const response = await harvestPlansApi.list({ take: 1000 });
                const allPlans = Array.isArray(response.data) ? response.data : 
                               response.data?.items || response.data?.value || response.data?.$values || Object.values(response.data || {});

                // Filter client-side for current and previous day
                const currentDate = new Date(targetDate);
                const previousDate = addDays(currentDate, -1);
                
                const currentDateStr = toYMD(currentDate);
                const previousDateStr = toYMD(previousDate);

                const filteredPlans = allPlans.filter(plan => {
                    if (!plan.date) return false;
                    
                    // Parse the plan date and compare with target dates
                    const planDate = new Date(plan.date);
                    const planDateStr = toYMD(planDate);
                    
                    return planDateStr === currentDateStr || planDateStr === previousDateStr;
                });

                console.log('HarvestPlanSelectorDialog: Date filtering applied:', {
                    targetDate: targetDate?.toISOString().split('T')[0],
                    currentDateStr,
                    previousDateStr,
                    totalPlans: allPlans.length,
                    filteredPlans: filteredPlans.length
                });

                setHarvestPlans(filteredPlans);
            } catch (err) {
                console.error('Failed to load harvest plans:', err);
                setError('Failed to load harvest plans');
            } finally {
                setLoading(false);
            }
        };

        loadHarvestPlans();
    }, [open, targetDate, harvestPlansApi]);

    const handlePlanToggle = (planId) => {
        setSelectedPlans(prev => 
            prev.includes(planId) 
                ? prev.filter(id => id !== planId)
                : [...prev, planId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPlans.length === harvestPlans.length) {
            setSelectedPlans([]);
        } else {
            setSelectedPlans(harvestPlans.map(plan => plan.id));
        }
    };

    const handleConfirm = () => {
        const selectedHarvestPlans = harvestPlans.filter(plan => selectedPlans.includes(plan.id));
        onSelectPlans(selectedHarvestPlans, targetDate);
        onClose();
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    const getBlockName = (plan) => {
        return plan.block?.name || `Block ${plan.grower_block_id}`;
    };

    const getContractorName = (plan) => {
        const contractor = contractorMap.get(plan.contractor_id);
        return contractor ? contractor.name : 'No contractor';
    };

    const getPoolName = (plan) => {
        const pool = poolMap.get(plan.pool_id);
        return pool ? pool.name : 'No pool';
    };

    const getCommodityName = (plan) => {
        return plan.commodity?.commodity || plan.commodity?.invoiceCommodity || 'Unknown';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        Bring from Harvest Plans
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Target Date: {formatDate(targetDate)}
                    </Typography>
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {harvestPlans.length} harvest plans found for current and previous day
                            </Typography>
                            <Button
                                size="small"
                                onClick={handleSelectAll}
                                variant="outlined"
                            >
                                {selectedPlans.length === harvestPlans.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </Box>

                        {harvestPlans.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                No harvest plans found for the current and previous day
                            </Typography>
                        ) : (
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {harvestPlans.map((plan) => (
                                    <ListItem key={plan.id} divider>
                                        <Checkbox
                                            checked={selectedPlans.includes(plan.id)}
                                            onChange={() => handlePlanToggle(plan.id)}
                                        />
                                        <ListItemText
                                            primary={
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {getBlockName(plan)}
                                                        </Typography>
                                                        {getCommodityName(plan) && (
                                                            <Chip
                                                                label={getCommodityName(plan)}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: getCommodityColor(getCommodityName(plan)),
                                                                    color: getContrastColor(getCommodityColor(getCommodityName(plan))),
                                                                    fontWeight: 500,
                                                                    fontSize: '0.7rem',
                                                                    height: 20
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Date: {formatDate(plan.date)} | 
                                                        Bins: {plan.bins || plan.planned_bins || 0} | 
                                                        Contractor: {getContractorName(plan)} | 
                                                        Pool: {getPoolName(plan)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleConfirm} 
                    variant="contained"
                    disabled={selectedPlans.length === 0}
                >
                    Create {selectedPlans.length} Process Plan{selectedPlans.length !== 1 ? 's' : ''}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
