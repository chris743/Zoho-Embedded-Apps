import React, { memo } from 'react';
import { Card, CardContent, Stack, Button, Typography, Chip } from '@mui/material';
import { Draggable } from '@hello-pangea/dnd';
import { PlanTitle } from './planners/WeeklyPlannerComponents/PlanTitle';
import { PlanDetails } from './planners/WeeklyPlannerComponents/PlanDetails';
import { ContractorInfo } from './planners/WeeklyPlannerComponents/ContractorInfo';

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

export const ProcessPlanCard = memo(function ProcessPlanCard({ plan, index, onEdit, onView }) {
    const { _card } = plan;
    
    // Simplified handlers without useCallback to avoid dependency issues
    const handleEditClick = () => onEdit && onEdit(plan);
    const handleViewClick = () => onView && onView(plan);
    
    return (
        <Draggable draggableId={String(plan.id)} index={index}>
            {(provided, snapshot) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                        mb: 1.2,
                        borderRadius: 2,
                        cursor: "grab",
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid',
                        borderColor: snapshot.isDragging ? 'primary.main' : 'grey.200',
                        boxShadow: snapshot.isDragging 
                            ? '0 8px 32px rgba(0,0,0,0.12)' 
                            : '0 2px 8px rgba(0,0,0,0.04)',
                        bgcolor: snapshot.isDragging ? 'primary.50' : 'white',
                        transform: snapshot.isDragging 
                            ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
                            : provided.draggableProps.style?.transform,
                        "&:hover": {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            transform: 'translateY(-1px)'
                        },
                        "&:active": { 
                            cursor: "grabbing",
                            transform: 'scale(1.02)'
                        }
                    }}
                >
                    <CardContent sx={{ p: 1.5 }}>
                        <Stack spacing={1.2}>
                            <PlanTitle 
                                blockName={_card?.blockName || 'Unknown Block'} 
                                grower={_card?.grower} 
                                blockID={_card?.blockID} 
                            />
                            
                            <PlanDetails 
                                commodityName={_card?.commodityName}
                                plannedBins={plan.bins}
                                actualBins={plan.actual_bins}
                                estimatedBins={null}
                            />
                            
                            {/* Process Plan specific status */}
                            <Chip
                                label={STATUS_LABELS[plan.run_status] || 'Pending'}
                                size="small"
                                color={STATUS_COLORS[plan.run_status] || 'default'}
                                variant="outlined"
                                sx={{ alignSelf: 'flex-start' }}
                            />
                            
                            {/* Additional Process Plan Info */}
                            {_card?.poolName && (
                                <Typography variant="caption" color="text.secondary">
                                    Pool: {_card.poolName}
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
                            
                            {_card?.contractorName && (
                                <ContractorInfo name={_card.contractorName} />
                            )}
                            
                            <Stack direction="row" spacing='0.8rem' sx={{justifyContent: "center"}}>
                                <Button onClick={handleEditClick} size="small" variant="outlined" color="secondary">
                                    Edit
                                </Button>
                                <Button onClick={handleViewClick} size="small" variant="outlined" color="primary">
                                    Actions
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            )}
        </Draggable>
    );
});