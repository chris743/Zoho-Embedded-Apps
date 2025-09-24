import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Stack,
    Grid,
    Paper,
    Divider,
    Chip,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { useViewMode } from '../../contexts/ViewModeContext';
import { ProcessPlansApi } from '../../api/processPlans';
import { useAuth } from '../../contexts/AuthContext';
import { BlockSelector } from '../forms/fields/BlockSelector';
import { PoolSelector } from '../forms/fields/PoolSelector';
import {
    Delete as DeleteIcon,
    Inventory as InventoryIcon,
    Map as BlockIcon,
} from '@mui/icons-material';

const RUN_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
];

export function ProcessPlanDialog({ 
    open, 
    onClose, 
    processPlan, 
    isEdit, 
    blocks, 
    pools, 
    commodities, 
    onSuccess, 
    onError 
}) {
    const { apiClient } = useAuth();
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();
    
    // Determine if we should use mobile layout
    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);
    const [formData, setFormData] = useState({
        block: null, // { source_database: string, id: number } | null
        bins: 0,
        run_date: '',
        pick_date: '',
        location: '',
        pool: null, // number | null
        notes: '',
        run_status: 'pending',
        batch_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

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


    const commodityMap = useMemo(() => {
        const map = new Map();
        commodities.forEach(commodity => {
            map.set(commodity.id, commodity);
        });
        return map;
    }, [commodities]);

    // Reset form when dialog opens/closes or process plan changes
    useEffect(() => {
        if (open) {
            if (isEdit && processPlan) {
                const blockValue = processPlan.source_database && processPlan.gablockidx ? 
                    { source_database: processPlan.source_database, id: processPlan.gablockidx } : null;
                
                console.log('ProcessPlanDialog: Setting block value for edit', {
                    processPlan: {
                        source_database: processPlan.source_database,
                        gablockidx: processPlan.gablockidx
                    },
                    blockValue,
                    blocksCount: blocks.length
                });
                
                 setFormData({
                     block: blockValue,
                     bins: processPlan.bins || 0,
                     run_date: processPlan.run_date ? new Date(processPlan.run_date).toISOString().split('T')[0] : '',
                     pick_date: processPlan.pick_date ? new Date(processPlan.pick_date).toISOString().split('T')[0] : '',
                     location: processPlan.location || '',
                     pool: processPlan.pool ? parseInt(processPlan.pool) : null,
                     notes: processPlan.notes || '',
                     run_status: processPlan.run_status || 'pending',
                     batch_id: processPlan.batch_id || ''
                 });
            } else {
                console.log('ProcessPlanDialog: Setting form data for new plan', {
                    isEdit,
                    processPlan,
                    blocksCount: blocks.length
                });
                 setFormData({
                     block: null,
                     bins: 0,
                     run_date: '',
                     pick_date: '',
                     location: '',
                     pool: null,
                     notes: '',
                     run_status: 'pending',
                     batch_id: ''
                 });
            }
            setError('');
            setFieldErrors({});
        }
    }, [open, isEdit, processPlan]);

    const handleInputChange = (field) => (event) => {
        const value = event.target.type === 'number' ? parseInt(event.target.value) || 0 : event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.block) {
            errors.block = 'Block is required';
        }
        
        if (formData.bins < 0) {
            errors.bins = 'Bins must be a positive number';
        }
        
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
             const processPlanData = {
                 source_database: formData.block?.source_database || 'COBBLESTONE',
                 gablockidx: formData.block?.id || 0,
                 bins: formData.bins,
                 run_date: formData.run_date ? new Date(formData.run_date).toISOString() : null,
                 pick_date: formData.pick_date ? new Date(formData.pick_date).toISOString() : null,
                 location: formData.location,
                 pool: formData.pool ? String(formData.pool) : '',
                 notes: formData.notes,
                 run_status: formData.run_status,
                 batch_id: formData.batch_id
             };
            
            if (isEdit) {
                await processPlansApi.update(processPlan.id, processPlanData);
                onSuccess('Process plan updated successfully');
            } else {
                await processPlansApi.create(processPlanData);
                onSuccess('Process plan created successfully');
            }
            
            onClose();
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 
                               err?.response?.data?.title || 
                               err?.message || 
                               `Failed to ${isEdit ? 'update' : 'create'} process plan`;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!isEdit || !processPlan?.id) return;
        
        const confirmed = window.confirm('Are you sure you want to delete this process plan? This action cannot be undone.');
        if (!confirmed) return;
        
        setLoading(true);
        setError('');
        
        try {
            await processPlansApi.remove(processPlan.id);
            onSuccess('Process plan deleted successfully');
            onClose();
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 
                               err?.response?.data?.title || 
                               err?.message || 
                               'Failed to delete process plan';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Get selected block info
    const selectedBlock = formData.block ? 
        blockMap.get(`${formData.block.source_database}:${formData.block.id}`) : null;
    const selectedCommodity = selectedBlock?.commodity ? 
        commodityMap.get(selectedBlock.commodity) : null;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth={isMobile ? "sm" : "lg"} 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { 
                    borderRadius: isMobile ? 0 : 3, 
                    minHeight: isMobile ? '100vh' : '600px',
                    margin: isMobile ? 0 : 'auto'
                }
            }}
        >
            <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <InventoryIcon />
                    </Box>
                    <Box>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {isEdit ? 'Edit Process Plan' : 'Create New Process Plan'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isEdit ? 'Update process plan details' : 'Set up a new process plan for production'}
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Stack spacing={4}>
                        {error && (
                            <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}
                        
                        {/* Block Selection Section */}
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <BlockIcon color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Block Selection
                                </Typography>
                            </Stack>
                            
                            <BlockSelector
                                blocks={blocks}
                                value={formData.block}
                                onChange={(block) => setFormData(prev => ({ ...prev, block }))}
                            />
                            {fieldErrors.block && (
                                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                    {fieldErrors.block}
                                </Typography>
                            )}

                            {/* Selected Block Info */}
                            {selectedBlock && (
                                <Box sx={{ mt: 2 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Selected Block
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                                                {selectedBlock.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                                <Chip 
                                                    label={`ID: ${selectedBlock.id}`} 
                                                    size="small" 
                                                    variant="outlined" 
                                                />
                                                {selectedCommodity && (
                                                    <Chip 
                                                        label={selectedCommodity.name} 
                                                        size="small" 
                                                        color="primary" 
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Box>
                            )}
                        </Paper>

                        <Grid container spacing={isMobile ? 1 : 2}>
                            {/* Essential Fields - Row 1 */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Bins"
                                    type="number"
                                    value={formData.bins}
                                    onChange={handleInputChange('bins')}
                                    error={!!fieldErrors.bins}
                                    helperText={fieldErrors.bins}
                                    disabled={loading}
                                    inputProps={{ min: 0 }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={formData.run_status}
                                        onChange={handleInputChange('run_status')}
                                        label="Status"
                                    >
                                        {RUN_STATUS_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Date Fields - Row 2 */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Run Date"
                                    type="date"
                                    value={formData.run_date}
                                    onChange={handleInputChange('run_date')}
                                    disabled={loading}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Pick Date"
                                    type="date"
                                    value={formData.pick_date}
                                    onChange={handleInputChange('pick_date')}
                                    error={!!fieldErrors.pick_date}
                                    helperText={fieldErrors.pick_date}
                                    disabled={loading}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* Additional Info - Row 4 */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Location"
                                    value={formData.location}
                                    onChange={handleInputChange('location')}
                                    disabled={loading}
                                    placeholder="e.g., Processing Plant A"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Batch ID"
                                    value={formData.batch_id}
                                    onChange={handleInputChange('batch_id')}
                                    disabled={loading}
                                    placeholder="Optional batch identifier"
                                />
                            </Grid>
                            {/* Pool Assignment - 20% width */}
                            <Grid item xs={12} sm={2} sx={{width: '20%'}}>
                                <PoolSelector
                                    pools={pools}
                                    value={formData.pool}
                                    onChange={(poolId) => setFormData(prev => ({ ...prev, pool: poolId }))}
                                />
                            </Grid>

                            {/* Notes - Full Width on Separate Line */}
                            <Grid item xs={12} width="100%">
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    multiline
                                    rows={2}
                                    value={formData.notes}
                                    onChange={handleInputChange('notes')}
                                    disabled={loading}
                                    placeholder="Additional notes or instructions..."
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                
                <DialogActions sx={{ 
                    p: isMobile ? 2 : 3, 
                    pt: 2, 
                    borderTop: '1px solid', 
                    borderColor: 'divider', 
                    gap: 2, 
                    justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row'
                }}>
                    {/* Left side - Delete button (only for edit mode) */}
                    <Box sx={{ order: isMobile ? 3 : 1 }}>
                        {isEdit && (
                            <Button 
                                onClick={handleDelete} 
                                disabled={loading}
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                fullWidth={isMobile}
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 500,
                                    borderRadius: 2,
                                    px: 3,
                                    minWidth: isMobile ? 'auto' : 120
                                }}
                            >
                                Delete
                            </Button>
                        )}
                    </Box>

                    {/* Right side - Cancel and Save buttons */}
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 2,
                        order: isMobile ? 2 : 2,
                        flexDirection: isMobile ? 'column' : 'row'
                    }}>
                        <Button 
                            onClick={handleClose} 
                            disabled={loading}
                            variant="outlined"
                            fullWidth={isMobile}
                            sx={{ 
                                textTransform: 'none', 
                                fontWeight: 500,
                                borderRadius: 2,
                                px: 3,
                                minWidth: isMobile ? 'auto' : 100
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={loading}
                            fullWidth={isMobile}
                            sx={{ 
                                textTransform: 'none', 
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 4,
                                minWidth: isMobile ? 'auto' : 180,
                                boxShadow: 2,
                                '&:hover': {
                                    boxShadow: 4
                                }
                            }}
                        >
                            {loading ? 'Saving...' : (isEdit ? 'Update Process Plan' : 'Create Process Plan')}
                        </Button>
                    </Box>
                </DialogActions>
            </form>
        </Dialog>
    );
}
