import React from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Droppable } from '@hello-pangea/dnd';
import { toYMD } from '../../../utils/dateUtils';
import { ProcessPlanCard } from './ProcessPlanCard';

export function DayColumn({ 
    day, 
    dayDate, 
    plans, 
    blockMap, 
    poolMap, 
    contractorMap, 
    commodityMap, 
    onEdit, 
    onMenuOpen, 
    isWeekend,
    onBringFromHarvestPlans,
    isMobile = false
}) {
    const isToday = toYMD(new Date()) === day;
    
    // Safely get date number
    const getDateNumber = (date) => {
        try {
            return date instanceof Date ? date.getDate() : new Date(date).getDate();
        } catch (error) {
            return 1; // fallback
        }
    };
    
    // Get weekday short name
    const getWeekdayShort = (date) => {
        try {
            const d = date instanceof Date ? date : new Date(date);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        } catch (error) {
            return 'Mon'; // fallback
        }
    };
    
    return (
        <Paper
            elevation={0}
            sx={{
                width: isMobile ? '100%' : 'calc((100% - 96px) / 7)',
                minWidth: isMobile ? '100%' : 'calc((100% - 96px) / 7)',
                maxWidth: isMobile ? '100%' : 'calc((100% - 96px) / 7)',
                height: 'fit-content',
                minHeight: isMobile ? 200 : 400,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isToday ? 'primary.main' : 'grey.200',
                bgcolor: isWeekend ? 'grey.25' : 'white',
                overflow: 'hidden'
            }}
        >
            {/* Day Header */}
            <Box sx={{ 
                p: 0,
                bgcolor: isToday 
                    ? 'primary.50' 
                    : isWeekend 
                        ? 'grey.50' 
                        : 'grey.25',
                borderBottom: '1px solid',
                borderColor: isToday ? 'primary.200' : 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1
            }}>
                <Typography 
                    variant={isMobile ? "caption" : "subtitle1"}
                    sx={{ 
                        fontWeight: 600,
                        color: isToday ? 'primary.800' : 'grey.800',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        letterSpacing: '0.025em',
                        py: 1,
                        flex: 1,
                        textAlign: 'center'
                    }}
                >
                    {getWeekdayShort(dayDate).toUpperCase()}, {getDateNumber(dayDate)}
                </Typography>
                <Tooltip title="Bring from Harvest Plans">
                    <IconButton
                        size="small"
                        onClick={() => onBringFromHarvestPlans && onBringFromHarvestPlans(dayDate)}
                        sx={{
                            color: isToday ? 'primary.600' : 'grey.600',
                            '&:hover': {
                                bgcolor: isToday ? 'primary.100' : 'grey.100'
                            }
                        }}
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            
            {/* Drop Zone */}
            <Droppable droppableId={day}>
                {(provided, snapshot) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                            minHeight: isMobile ? 150 : 300,
                            p: isMobile ? 1 : 2,
                            bgcolor: snapshot.isDraggingOver 
                                ? 'primary.50' 
                                : 'transparent',
                            transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                            borderRadius: snapshot.isDraggingOver ? 1 : 0,
                            border: snapshot.isDraggingOver 
                                ? '2px dashed' 
                                : '2px solid transparent',
                            borderColor: snapshot.isDraggingOver 
                                ? 'primary.300' 
                                : 'transparent'
                        }}
                    >
                        {plans.map((plan, index) => (
                            <ProcessPlanCard
                                key={plan.id}
                                plan={plan}
                                index={index}
                                blockMap={blockMap}
                                poolMap={poolMap}
                                contractorMap={contractorMap}
                                commodityMap={commodityMap}
                                onEdit={onEdit}
                                onMenuOpen={onMenuOpen}
                                isMobile={isMobile}
                            />
                        ))}
                        {plans.length === 0 && !snapshot.isDraggingOver && (
                            <Box sx={{ 
                                textAlign: 'center', 
                                py: 4,
                                color: 'grey.400'
                            }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    No plans scheduled
                                </Typography>
                            </Box>
                        )}
                        {provided.placeholder}
                    </Box>
                )}
            </Droppable>
        </Paper>
    );
}
