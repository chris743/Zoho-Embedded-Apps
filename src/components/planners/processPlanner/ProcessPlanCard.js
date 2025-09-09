import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Chip,
    IconButton,
    Card,
    CardContent
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Draggable } from '@hello-pangea/dnd';
import { getCommodityColor, getContrastColor } from '../../../utils/theme';
import { STATUS_COLORS, STATUS_LABELS } from './constants';

export const ProcessPlanCard = React.memo(function ProcessPlanCard({ 
    plan, 
    index, 
    blockMap, 
    poolMap, 
    contractorMap, 
    commodityMap, 
    onEdit, 
    onMenuOpen 
}) {
    // Use the nested block object from the process plan
    const block = plan.block;
    const pool = poolMap.get(plan.pool);
    const contractor = contractorMap.get(plan.contractor);
    
    // Use the nested commodity object from the process plan
    const commodity = plan.commodity?.commodity || null;
    
    // The commodity map stores the commodity name as the value, not an object
    const commodityName = commodity || null;
    const commodityColor = commodityName ? getCommodityColor(commodityName) : '#e0e0e0';
    const textColor = commodityName ? getContrastColor(commodityColor) : '#000';
    
    const handleCardClick = (e) => {
        // Prevent card click when clicking the menu button
        if (e.target.closest('[data-menu-button]')) {
            return;
        }
        onEdit(plan);
    };
    
    return (
        <Draggable draggableId={String(plan.id)} index={index}>
            {(provided, snapshot) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={handleCardClick}
                    sx={{
                        borderRadius: 2,
                        cursor: snapshot.isDragging ? "grabbing" : "grab",
                        transition: snapshot.isDragging 
                            ? 'none' 
                            : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid',
                        borderColor: snapshot.isDragging ? 'primary.main' : 'grey.200',
                        boxShadow: snapshot.isDragging 
                            ? '0 8px 32px rgba(0,0,0,0.12)' 
                            : '0 2px 8px rgba(0,0,0,0.04)',
                        bgcolor: snapshot.isDragging ? 'primary.50' : 'white',
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                        zIndex: snapshot.isDragging ? 1000 : 'auto',
                        "&:hover": !snapshot.isDragging ? {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            transform: 'translateY(-1px)'
                        } : {},
                        "&:active": !snapshot.isDragging ? { 
                            cursor: "grabbing",
                            transform: 'scale(1.02)'
                        } : {}
                    }}
                >
                    <CardContent sx={{ p: 0.8, pb: 0.6 }}>
                        <Stack spacing={0.6}>
                            {/* Block ID, Name and Menu */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {block?.id || plan.gablockidx || 'Unknown'}
                                    </Typography>
                                    {block?.name && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                            {block.name}
                                        </Typography>
                                    )}
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={(e) => onMenuOpen(e, plan)}
                                    data-menu-button
                                    sx={{ ml: 1 }}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            
                            {/* Commodity and Status Chips */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                {commodityName && (
                                    <Chip
                                        label={commodityName}
                                        size="small"
                                        sx={{
                                            backgroundColor: commodityColor,
                                            color: textColor,
                                            fontWeight: 500,
                                            fontSize: '0.7rem',
                                            height: 22,
                                            width: 'fit-content'
                                        }}
                                    />
                                )}
                                <Chip
                                    label={STATUS_LABELS[plan.run_status] || 'Pending'}
                                    size="small"
                                    color={STATUS_COLORS[plan.run_status] || 'default'}
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                />
                            </Box>
                            
                            {/* Bins Count */}
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {plan.bins || 0} bins
                            </Typography>
                            
                            {/* Additional Info */}
                            {pool && (
                                <Typography variant="caption" color="text.secondary">
                                    Pool: {pool.name}
                                </Typography>
                            )}
                            
                            {contractor && (
                                <Typography variant="caption" color="text.secondary">
                                    Contractor: {contractor.name}
                                </Typography>
                            )}
                            
                            {plan.location && (
                                <Typography variant="caption" color="text.secondary">
                                    Location: {plan.location}
                                </Typography>
                            )}
                            
                            {plan.batch_id && (
                                <Typography variant="caption" color="text.secondary">
                                    Batch: {plan.batch_id}
                                </Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            )}
        </Draggable>
    );
});

ProcessPlanCard.displayName = 'ProcessPlanCard';
