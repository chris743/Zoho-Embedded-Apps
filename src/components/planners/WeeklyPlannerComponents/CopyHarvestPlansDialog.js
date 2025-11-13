import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Checkbox,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import { toYMD } from '../../../utils/dateUtils';
import { getCommodityColor, getContrastColor } from '../../../utils/theme';

export default function CopyHarvestPlansDialog({
    open,
    onClose,
    targetDate,
    allPlans,
    onCopyPlans,
    loading = false
}) {
    const [selectedPlanIds, setSelectedPlanIds] = useState([]);

    // Calculate previous day
    const previousDate = useMemo(() => {
        if (!targetDate) return null;
        const date = new Date(targetDate);
        date.setDate(date.getDate() - 1);
        return date;
    }, [targetDate]);

    // Filter plans from previous day
    const previousDayPlans = useMemo(() => {
        if (!previousDate || !allPlans) return [];
        const prevYmd = toYMD(previousDate);
        return allPlans.filter(plan => {
            if (!plan.date) return false;
            return toYMD(new Date(plan.date)) === prevYmd;
        });
    }, [previousDate, allPlans]);

    // Reset selection when dialog opens/closes
    useEffect(() => {
        if (open) {
            setSelectedPlanIds([]);
        }
    }, [open]);

    const handleToggle = (planId) => {
        setSelectedPlanIds(prev => {
            if (prev.includes(planId)) {
                return prev.filter(id => id !== planId);
            } else {
                return [...prev, planId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedPlanIds.length === previousDayPlans.length) {
            // Deselect all
            setSelectedPlanIds([]);
        } else {
            // Select all
            setSelectedPlanIds(previousDayPlans.map(plan => plan.id));
        }
    };

    const handleCopy = () => {
        const selectedPlans = previousDayPlans.filter(plan => selectedPlanIds.includes(plan.id));
        onCopyPlans(selectedPlans, targetDate);
    };

    const formatDateStr = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Copy Harvest Plans
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Copy plans from {formatDateStr(previousDate)} to {formatDateStr(targetDate)}
                </Typography>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : previousDayPlans.length === 0 ? (
                    <Alert severity="info">
                        No harvest plans found for {formatDateStr(previousDate)}
                    </Alert>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {previousDayPlans.length} plan{previousDayPlans.length !== 1 ? 's' : ''} available
                            </Typography>
                            <Button
                                size="small"
                                onClick={handleSelectAll}
                                sx={{ textTransform: 'none' }}
                            >
                                {selectedPlanIds.length === previousDayPlans.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </Box>

                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {previousDayPlans.map((plan) => {
                                const blockName = plan.block?.name || plan.block_name || `Block ${plan.grower_block_id}`;
                                const growerName = plan.block?.growerName || plan.grower_name || '';
                                const commodityName = plan.commodity?.commodity || plan.commodityName || '';
                                const bins = plan.bins ?? plan.planned_bins ?? 0;
                                const poolId = plan.pool?.id || plan.pool_id || '';
                                const contractorName = plan.laborContractorName ||
                                                      plan.contractor?.name ||
                                                      (plan.contractor_id ? `Contractor ${plan.contractor_id}` : '');

                                return (
                                    <ListItem
                                        key={plan.id}
                                        disablePadding
                                        sx={{
                                            borderBottom: '1px solid',
                                            borderColor: 'grey.200'
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() => handleToggle(plan.id)}
                                            dense
                                        >
                                            <Checkbox
                                                edge="start"
                                                checked={selectedPlanIds.includes(plan.id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {blockName}
                                                        </Typography>
                                                        {growerName && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                ({growerName})
                                                            </Typography>
                                                        )}
                                                        {commodityName && (
                                                            <Chip
                                                                label={commodityName}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: getCommodityColor(commodityName),
                                                                    color: getContrastColor(getCommodityColor(commodityName)),
                                                                    height: 20,
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Bins: {bins}
                                                        </Typography>
                                                        {poolId && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Pool: {poolId}
                                                            </Typography>
                                                        )}
                                                        {contractorName && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Labor: {contractorName}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleCopy}
                    variant="contained"
                    disabled={selectedPlanIds.length === 0 || loading}
                    sx={{ textTransform: 'none' }}
                >
                    Copy {selectedPlanIds.length} Plan{selectedPlanIds.length !== 1 ? 's' : ''}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
