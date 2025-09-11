import React, { useState, useMemo } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { useViewMode } from '../../contexts/ViewModeContext';
import {
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    PlayArrow as StartIcon,
    CheckCircle as CompleteIcon,
    Cancel as CancelIcon,
    FileDownload as ExportIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { ProcessPlansApi } from '../../api/processPlans';
import { useAuth } from '../../contexts/AuthContext';
import { getCommodityColor, getContrastColor } from '../../utils/theme';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to safely format dates
const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
    }
    try {
        return new Date(dateValue).toLocaleDateString();
    } catch (error) {
        return '-';
    }
};

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

export function ProcessPlansTable({ 
    processPlans, 
    blocks, 
    pools, 
    contractors, 
    commodities, 
    onEdit, 
    onSuccess, 
    onError 
}) {
    const { apiClient } = useAuth();
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProcessPlan, setSelectedProcessPlan] = useState(null);

    // Determine if we should use mobile layout
    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);

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
        const map = new Map();
        commodities.forEach(commodity => {
            map.set(commodity.id, commodity);
        });
        return map;
    }, [commodities]);

    // Filter and sort data
    const { filteredData, groupedData } = useMemo(() => {
        let filtered = processPlans.filter(plan => {
            if (!search.trim()) return true;
            const searchLower = search.toLowerCase();
            const blockName = plan.block?.name || '';
            const poolName = poolMap.get(plan.pool)?.name || '';
            const contractorName = contractorMap.get(plan.contractor)?.name || '';
            
            return (
                blockName.toLowerCase().includes(searchLower) ||
                poolName.toLowerCase().includes(searchLower) ||
                contractorName.toLowerCase().includes(searchLower) ||
                (plan.batch_id || '').toLowerCase().includes(searchLower) ||
                (plan.notes || '').toLowerCase().includes(searchLower)
            );
        });

        // Sort by run_date, then row_order
        filtered.sort((a, b) => {
            const dateA = new Date(a.run_date || 0);
            const dateB = new Date(b.run_date || 0);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            return (a.row_order || 0) - (b.row_order || 0);
        });

        // Group by status for totals
        const grouped = [];
        const statusGroups = {};
        
        filtered.forEach(plan => {
            const status = plan.run_status || 'pending';
            if (!statusGroups[status]) {
                statusGroups[status] = { plans: [], totalBins: 0 };
            }
            statusGroups[status].plans.push(plan);
            statusGroups[status].totalBins += plan.bins || 0;
        });

        // Add grouped data
        Object.entries(statusGroups).forEach(([status, group]) => {
            grouped.push(...group.plans);
            if (group.plans.length > 0) {
                grouped.push({
                    isTotal: true,
                    status,
                    totalBins: group.totalBins,
                    rowCount: group.plans.length
                });
            }
        });

        return { filteredData: filtered, groupedData: grouped };
    }, [processPlans, search, blockMap, poolMap, contractorMap, commodityMap]);

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
            await processPlansApi.startProcess(selectedProcessPlan.id);
            onSuccess('Process started successfully');
            handleMenuClose();
        } catch (err) {
            onError(err?.response?.data?.message || 'Failed to start process');
        }
    };

    const handleCompleteProcess = async () => {
        if (!selectedProcessPlan) return;
        
        try {
            await processPlansApi.completeProcess(selectedProcessPlan.id);
            onSuccess('Process completed successfully');
            handleMenuClose();
        } catch (err) {
            onError(err?.response?.data?.message || 'Failed to complete process');
        }
    };

    const exportToCSV = () => {
        const exportData = filteredData.map(plan => {
            const pool = poolMap.get(plan.pool);
            const contractor = contractorMap.get(plan.contractor);
            
            return {
                'Block Name': plan.block?.name || '',
                'Bins': plan.bins || 0,
                'Run Date': formatDate(plan.run_date),
                'Pick Date': formatDate(plan.pick_date),
                'Location': plan.location || '',
                'Pool': pool?.name || '',
                'Status': STATUS_LABELS[plan.run_status] || 'Pending',
                'Batch ID': plan.batch_id || '',
                'Notes': plan.notes || ''
            };
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `process-plans-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        
        // Title
        doc.setFontSize(16);
        doc.text('Process Plans Report', 14, 22);
        
        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Summary
        const totalPlans = filteredData.length;
        const totalBins = filteredData.reduce((sum, plan) => sum + (plan.bins || 0), 0);
        doc.text(`Total Plans: ${totalPlans} | Total Bins: ${totalBins}`, 14, 38);
        
        // Table data
        const tableData = filteredData.map(plan => {
            const pool = poolMap.get(plan.pool);
            
            return [
                plan.block?.name || '',
                plan.bins || 0,
                formatDate(plan.run_date),
                formatDate(plan.pick_date),
                plan.location || '',
                pool?.name || '',
                STATUS_LABELS[plan.run_status] || 'Pending',
                plan.batch_id || '',
                plan.notes || ''
            ];
        });
        
        autoTable(doc, {
            startY: 45,
            head: [['Block Name', 'Bins', 'Run Date', 'Pick Date', 'Location', 'Pool', 'Status', 'Batch ID', 'Notes']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [25, 118, 210] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        
        doc.save(`process-plans-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Box sx={{ p: 2 }}>
                <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: isMobile ? "flex-start" : "center", 
                    mb: 2,
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 2 : 0
                }}>
                    <Typography variant="h6">
                        Process Plans - {filteredData.length} Plans
                        {isMobile && (
                            <Chip 
                                label="📱 Mobile View" 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 2, fontSize: '0.7rem' }}
                            />
                        )}
                    </Typography>
                    <Box sx={{ 
                        display: "flex", 
                        gap: 1,
                        flexDirection: isMobile ? "row" : "row",
                        width: isMobile ? "100%" : "auto"
                    }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ExportIcon />}
                            onClick={exportToCSV}
                            sx={{ 
                                textTransform: 'none',
                                flex: isMobile ? 1 : 'auto'
                            }}
                        >
                            {isMobile ? 'CSV' : 'Export CSV'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PdfIcon />}
                            onClick={exportToPDF}
                            sx={{ 
                                textTransform: 'none', 
                                color: 'error.main',
                                flex: isMobile ? 1 : 'auto'
                            }}
                        >
                            {isMobile ? 'PDF' : 'Print PDF'}
                        </Button>
                    </Box>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    label="Search process plans..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                />
            </Box>

            {isMobile ? (
                // Mobile Card Layout
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 2
                }}>
                    {groupedData.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                {search ? 'No process plans match the search criteria' : 'No process plans found'}
                            </Typography>
                        </Box>
                    ) : (
                            groupedData.map((plan, index) => {
                                if (plan.isTotal) {
                                    return (
                                        <Card key={`total-${plan.status}`} sx={{ bgcolor: 'grey.50', border: '2px solid', borderColor: 'grey.200' }}>
                                            <CardContent sx={{ py: 1, px: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Chip 
                                                        label={`${plan.status.toUpperCase()} TOTAL`}
                                                        size="small"
                                                        color={STATUS_COLORS[plan.status]}
                                                        variant="outlined"
                                                    />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {plan.totalBins} bins across {plan.rowCount} plans
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                const pool = poolMap.get(plan.pool);
                                const contractor = contractorMap.get(plan.contractor);
                                
                                // Get commodity info from nested commodity object
                                const commodity = plan.commodity?.commodity || null;
                                const commodityColor = commodity ? getCommodityColor(commodity) : '#e0e0e0';
                                const textColor = commodity ? getContrastColor(commodityColor) : '#000';

                                return (
                                    <Card key={plan.id} sx={{ 
                                        cursor: 'pointer', 
                                        '&:hover': { boxShadow: 4 },
                                        border: '2px solid',
                                        borderColor: 'primary.200',
                                        borderRadius: 3,
                                        boxShadow: 2
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            {/* Header with Block info and Actions */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        {commodity && (
                                                            <Chip
                                                                label={commodity}
                                                                size="small"
                                                                sx={{
                                                                    height: '20px',
                                                                    fontSize: '0.7rem',
                                                                    backgroundColor: commodityColor,
                                                                    color: textColor
                                                                }}
                                                            />
                                                        )}
                                                        <Chip
                                                            label={STATUS_LABELS[plan.run_status] || 'Pending'}
                                                            size="small"
                                                            color={STATUS_COLORS[plan.run_status] || 'default'}
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                        {plan.block?.name || 'Unknown Block'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                        {plan.block?.id || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Edit Process Plan">
                                                        <IconButton size="small" onClick={() => onEdit(plan)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="More Actions">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => handleMenuOpen(e, plan)}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            <Divider sx={{ my: 1 }} />

                                            {/* Details Grid */}
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Bins</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {plan.bins || 0}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Pool</Typography>
                                                    <Typography variant="body2">
                                                        {pool?.name || '-'}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Run Date</Typography>
                                                    <Typography variant="body2">
                                                        {formatDate(plan.run_date)}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Pick Date</Typography>
                                                    <Typography variant="body2">
                                                        {formatDate(plan.pick_date)}
                                                    </Typography>
                                                </Box>
                                                {plan.location && (
                                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                                        <Typography variant="caption" color="text.secondary">Location</Typography>
                                                        <Typography variant="body2">
                                                            {plan.location}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {plan.batch_id && (
                                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                                        <Typography variant="caption" color="text.secondary">Batch ID</Typography>
                                                        <Typography variant="body2">
                                                            {plan.batch_id}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                </Box>
            ) : (
                // Desktop Table Layout
                <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Block</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Bins</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Run Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Pick Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Location</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Pool</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Batch ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography color="text.secondary">
                                            {search ? 'No process plans match the search criteria' : 'No process plans found'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groupedData.map((plan, index) => {
                                    if (plan.isTotal) {
                                        return (
                                            <TableRow key={`total-${plan.status}`} sx={{ height: '32px' }}>
                                                <TableCell 
                                                    colSpan={2}
                                                    sx={{ 
                                                        fontWeight: 'bold',
                                                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                        borderTop: '2px solid rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    <Chip 
                                                        label={`${plan.status.toUpperCase()} TOTAL`}
                                                        size="small"
                                                        color={STATUS_COLORS[plan.status]}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell 
                                                    colSpan={6}
                                                    sx={{ 
                                                        fontWeight: 'bold',
                                                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                        borderTop: '2px solid rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    {plan.totalBins} bins across {plan.rowCount} plans
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    const pool = poolMap.get(plan.pool);
                                    const contractor = contractorMap.get(plan.contractor);
                                    
                                    // Get commodity info from nested commodity object
                                    const commodity = plan.commodity?.commodity || null;
                                    const commodityColor = commodity ? getCommodityColor(commodity) : '#e0e0e0';
                                    const textColor = commodity ? getContrastColor(commodityColor) : '#000';

                                    return (
                                        <TableRow key={plan.id} hover sx={{ height: '36px' }}>
                                            <TableCell sx={{ py: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {commodity && (
                                                        <Chip
                                                            label={commodity}
                                                            size="small"
                                                            sx={{
                                                                height: '20px',
                                                                fontSize: '0.7rem',
                                                                backgroundColor: commodityColor,
                                                                color: textColor
                                                            }}
                                                        />
                                                    )}
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {plan.block?.name || 'Unknown Block'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {plan.bins || 0}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                {formatDate(plan.run_date)}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                {formatDate(plan.pick_date)}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                {plan.location || '-'}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                {pool?.name || '-'}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                <Chip
                                                    label={STATUS_LABELS[plan.run_status] || 'Pending'}
                                                    size="small"
                                                    color={STATUS_COLORS[plan.run_status] || 'default'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                {plan.batch_id || '-'}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5 }}>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Edit Process Plan">
                                                        <IconButton size="small" onClick={() => onEdit(plan)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="More Actions">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => handleMenuOpen(e, plan)}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ p: 2, borderTop: "1px solid rgba(224, 224, 224, 1)" }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredData.length} of {processPlans.length} process plans
                </Typography>
            </Box>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleStatusChange('pending')}>
                    <ListItemIcon><CancelIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Set to Pending</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('in_progress')}>
                    <ListItemIcon><StartIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Set to In Progress</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('completed')}>
                    <ListItemIcon><CompleteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Set to Completed</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('cancelled')}>
                    <ListItemIcon><CancelIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Set to Cancelled</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleStartProcess}>
                    <ListItemIcon><StartIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Start Process</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleCompleteProcess}>
                    <ListItemIcon><CompleteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Complete Process</ListItemText>
                </MenuItem>
            </Menu>
        </Paper>
    );
}
