import { useState, useEffect, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Box, Typography } from "@mui/material";
import { toYMD } from "../utils/dateUtils";
import { enrichPlan, createBlockMap, createContractorMap, createCommodityMap } from "../utils/dataUtils";

export default function DNDTESTCOMPONENT({ plans = [], blocks = [], contractors = [], commodities = [], fieldRepresentatives = [], columns = [], svc, onPlanUpdate, onRefresh }) {
    const isDraggingRef = useRef(false);
    const lastPlansIdsRef = useRef(new Set());
    
    // Create lookup maps
    const lookupMaps = useMemo(() => {
        const fieldRepMap = new Map();
        for (const fr of fieldRepresentatives || []) {
            if (fr.id != null) {
                fieldRepMap.set(fr.id, fr);
            }
        }
        return {
            blocks: createBlockMap(blocks),
            contractors: createContractorMap(contractors),
            commodities: createCommodityMap(commodities),
            fieldRepresentatives: fieldRepMap
        };
    }, [blocks, contractors, commodities, fieldRepresentatives]);

    // Initialize items from plans grouped by date
    const [items, setItems] = useState(() => {
        const itemsByColumn = {};
        if (columns && columns.length > 0) {
            columns.forEach((col) => {
                itemsByColumn[col.id] = [];
            });
        }
        return itemsByColumn;
    });

    // Update items when plans or columns change (but not during drag operations)
    useEffect(() => {
        if (columns && columns.length > 0 && !isDraggingRef.current) {
            // Check if plans actually changed by comparing IDs
            const currentPlanIds = new Set((plans || []).map(p => String(p.id)));
            const lastPlanIds = lastPlansIdsRef.current;
            
            // Only process if plans actually changed
            const plansChanged = currentPlanIds.size !== lastPlanIds.size ||
                [...currentPlanIds].some(id => !lastPlanIds.has(id)) ||
                [...lastPlanIds].some(id => !currentPlanIds.has(id));
            
            if (!plansChanged && lastPlanIds.size > 0) {
                return; // No changes, skip update
            }
            
            // Update ref with current plan IDs
            lastPlansIdsRef.current = currentPlanIds;
            
            // Compute plansByDate inside useEffect to avoid dependency issues
            const enrichedPlans = (plans || []).map(plan => enrichPlan(plan, lookupMaps));
            const plansByDate = {};
            
            enrichedPlans.forEach(plan => {
                if (plan.date) {
                    const dateKey = toYMD(plan.date);
                    if (!plansByDate[dateKey]) {
                        plansByDate[dateKey] = [];
                    }
                    plansByDate[dateKey].push(plan);
                }
            });
            
            setItems(prevItems => {
                const newItems = {};
                let hasChanges = false;
                
                columns.forEach((col) => {
                    const plansForDate = plansByDate[col.id] || [];
                    const currentItems = prevItems[col.id] || [];
                    
                    // Compare by IDs to see if plans actually changed
                    const currentIds = new Set(currentItems.map(p => String(p.id)).sort());
                    const newIds = new Set(plansForDate.map(p => String(p.id)).sort());
                    
                    const idsEqual = currentIds.size === newIds.size && 
                        [...currentIds].every(id => newIds.has(id));
                    
                    if (!idsEqual) {
                        newItems[col.id] = plansForDate;
                        hasChanges = true;
                    } else {
                        // Keep existing items to preserve order/manual changes
                        newItems[col.id] = currentItems;
                    }
                });
                
                // Only update state if there are actual changes
                return hasChanges ? newItems : prevItems;
            });
        }
    }, [columns, plans, lookupMaps]);
    
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
};

    const onDragStart = () => {
        isDraggingRef.current = true;
    };

    const onDragEnd = (result) => {
        const { destination, source } = result;
        
        // Reset dragging flag after a short delay to allow state updates
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
        
        if (!destination) return;
        
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const sourceItems = items[source.droppableId] || [];
        const destinationItems = items[destination.droppableId] || [];

        if (source.droppableId === destination.droppableId) {
            // Moving within same column
            const reordered = reorder(sourceItems, source.index, destination.index);
            setItems({
                ...items,
                [source.droppableId]: reordered,
            });
        } else {
            // Moving between columns - optimistic update first
            const sourceClone = Array.from(sourceItems);
            const destClone = Array.from(destinationItems);
            const [movedPlan] = sourceClone.splice(source.index, 1);
            
            if (!movedPlan) return;
            
            // Store original state for potential revert
            const originalItems = { ...items };
            
            // Update the plan's date to match the destination column
            const newDate = new Date(destination.droppableId + "T00:00:00").toISOString();
            movedPlan.date = newDate;
            
            destClone.splice(destination.index, 0, movedPlan);
            
            // Optimistic update - immediately update UI
            setItems({
                ...items,
                [source.droppableId]: sourceClone,
                [destination.droppableId]: destClone,
            });
            
            // Persist to server
            if (svc && movedPlan.id) {
                (async () => {
                    try {
                        await svc.update(movedPlan.id, { date: newDate });
                        
                        // Success - refresh data quietly
                        if (onRefresh) {
                            await onRefresh();
                        }
                        
                        // Update parent component state
                        if (onPlanUpdate) {
                            onPlanUpdate(movedPlan.id, { date: newDate });
                        }
                    } catch (err) {
                        // Revert optimistic update on error
                        console.error('Failed to update plan date:', err);
                        setItems(originalItems);
                        
                        // Show error to user
                        alert(err?.response?.data?.title || err?.message || 'Failed to move plan');
                    }
                })();
            }
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <Box 
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(4, 1fr)',
                            lg: 'repeat(7, 1fr)'
                        },
                        gap: 2
                    }}
                >
                    {columns && columns.length > 0 ? columns.map((column) => {
                        const columnItems = items[column.id] || [];
                        return(
                            <Box
                                key={column.id}
                                sx={{
                                    bgcolor: 'white',
                                    borderRadius: 2,
                                    border: 2,
                                    borderColor: 'grey.300',
                                    boxShadow: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '400px',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'grey.400',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                <Box 
                                    sx={{
                                        py: 2,
                                        px: 3,
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        color: 'grey.800',
                                        borderBottom: 2,
                                        borderColor: 'grey.200',
                                        width: '100%',
                                        textAlign: 'center',
                                        bgcolor: 'grey.50'
                                    }}
                                >
                                    {column.title}
                                </Box>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        px: 3,
                                        pt: 1,
                                        pb: 2,
                                        color: 'grey.600',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {column.date}
                                </Typography>
                                
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <Box
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                                            sx={{
                                                flex: 1,
                                                p: 2,
                                                minHeight: '200px',
                                                bgcolor: snapshot.isDraggingOver ? 'primary.light' : 'transparent',
                                                transition: 'background-color 0.2s ease',
                                                borderRadius: '0 0 8px 8px'
                                            }}
                                        >
                                            {columnItems.map((item, index) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={String(item.id)}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Box
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={provided.draggableProps.style}
                                                            sx={{
                                                                mb: 1,
                                                                p: 2,
                                                                bgcolor: snapshot.isDragging ? 'primary.main' : 'white',
                                                                color: snapshot.isDragging ? 'white' : 'grey.800',
                                                                border: 1,
                                                                borderColor: snapshot.isDragging ? 'primary.main' : 'grey.300',
                                                                borderRadius: 1,
                                                                boxShadow: snapshot.isDragging ? 4 : 1,
                                                                cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                                                transition: snapshot.isDragging ? 'none' : 'all 0.2s ease',
                                                                opacity: snapshot.isDragging ? 1 : 1,
                                                                zIndex: snapshot.isDragging ? 1000 : 'auto',
                                                                '&:active': {
                                                                    cursor: 'grabbing'
                                                                },
                                                                '&:hover': !snapshot.isDragging ? {
                                                                    boxShadow: 2,
                                                                    borderColor: 'primary.main'
                                                                } : {}
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                {item._card?.blockName || `Block ${item.grower_block_id}`}
                                                            </Typography>
                                                            {item._card?.grower && (
                                                                <Typography variant="caption" sx={{ display: 'block', color: snapshot.isDragging ? 'rgba(255,255,255,0.9)' : 'grey.600' }}>
                                                                    {item._card.grower}
                                                                </Typography>
                                                            )}
                                                            {item._card?.commodityName && (
                                                                <Typography variant="caption" sx={{ display: 'block', color: snapshot.isDragging ? 'rgba(255,255,255,0.9)' : 'grey.600' }}>
                                                                    {item._card.commodityName}
                                                                </Typography>
                                                            )}
                                                            {(item.planned_bins || item.bins) && (
                                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                                                                    Bins: {item.bins || item.planned_bins || 0}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                        )}
                                    </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </Box>
                                    )}
                                </Droppable>
                            </Box>
                        );
                    }) : (
                        <Typography sx={{ p: 2 }}>No columns available</Typography>
                    )}
                </Box>
            </DragDropContext>
        </Box>
    );
}
