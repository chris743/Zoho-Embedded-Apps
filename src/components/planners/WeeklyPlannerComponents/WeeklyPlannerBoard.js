import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Box as MuiBox, useMediaQuery, useTheme, Stack, Typography } from "@mui/material";
import { DragDropContext } from "@hello-pangea/dnd";
import { useViewMode } from "../../../contexts/ViewModeContext";
import { startOfWeek, sevenDays, toYMD } from "../../../utils/dateUtils";
import { createBlockMap, createContractorMap, createCommodityMap, buildBuckets } from "../../../utils/dataUtils";
import { WeekGrid } from "./WeekGrid";

export function WeeklyPlannerBoard({
  plans = [],
  blocks = [],
  contractors = [],
  commodities = [],
  onEdit,
  onView,
  svc,
  weekStart,
  onWeekChange,
  onPlanUpdate,
}) {
  const theme = useTheme();
  const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { viewMode } = useViewMode();
  
  // Determine if we should use mobile layout
  const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);
  
  // Memoized week calculations - stable default date
  const defaultWeekStart = useMemo(() => new Date(), []); // Only create once
  const start = useMemo(() => startOfWeek(weekStart || defaultWeekStart), [weekStart, defaultWeekStart]);
  const days = useMemo(() => sevenDays(start), [start]);
  const dayKeys = useMemo(() => days.map(toYMD), [days]);

  // Stable lookup maps
  const lookupMaps = useMemo(() => ({
    blocks: createBlockMap(blocks),
    contractors: createContractorMap(contractors),
    commodities: createCommodityMap(commodities)
  }), [blocks, contractors, commodities]);

  // State management
  const [buckets, setBuckets] = useState({});

  // Build buckets when plans change
  useEffect(() => {
    const newBuckets = buildBuckets(plans, dayKeys, lookupMaps);
    setBuckets(newBuckets);
  }, [plans, dayKeys, lookupMaps]);

  // Event handlers
  const handleEdit = useCallback((plan) => {
    onEdit?.(plan);
  }, [onEdit]);

  const handleView = useCallback((plan) => {
    onView?.(plan);
  }, [onView]);

  // DRAG AND DROP - SIMPLIFIED
  const handleDragStart = useCallback(() => {
    // No need to set dragging state - just let it drag
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return;
    }
    
    const sourceDay = source.droppableId;
    const destDay = destination.droppableId;
    const planId = draggableId;
    
    // Find the plan - handle both string and number IDs
    const plan = plans.find(p => p.id === planId || p.id === Number(planId) || String(p.id) === planId);
    if (!plan) return;
    
    // Store original buckets for potential revert
    const originalBuckets = { ...buckets };
    
    // Optimistic update - immediately update UI
    setBuckets(prev => {
      const newBuckets = { ...prev };
      const sourcePlans = [...(prev[sourceDay] || [])];
      const destPlans = sourceDay === destDay ? sourcePlans : [...(prev[destDay] || [])];
      
      // Remove from source
      const movedPlan = sourcePlans.splice(source.index, 1)[0];
      if (!movedPlan) return prev;
      
      // Update date if moving to different day
      if (sourceDay !== destDay) {
        movedPlan.date = new Date(destDay + "T00:00:00").toISOString();
      }
      
      // Insert at destination
      destPlans.splice(destination.index, 0, movedPlan);
      
      newBuckets[sourceDay] = sourcePlans;
      if (sourceDay !== destDay) {
        newBuckets[destDay] = destPlans;
      }

      return newBuckets;
    });
    
    // Persist to server and update parent state
    try {
      const newDate = new Date(destDay + "T00:00:00").toISOString();
      const updateId = plan.id; // Use the actual plan ID, not the draggableId
      
      console.log('🔄 API Update Debug:', {
        updateId,
        updateIdType: typeof updateId,
        newDate,
        destDay,
        planId: plan.id,
        planIdType: typeof plan.id,
        planObject: plan
      });
      
      await svc.update(updateId, { date: newDate });
      console.log('✅ API update successful');
      
      // Update parent component state to reflect the change
      if (onPlanUpdate) {
        onPlanUpdate(updateId, { date: newDate });
      }
    } catch (err) {
      // Revert optimistic update on error
      console.error("❌ Move failed:", err);
      console.error("❌ Error details:", {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        config: err?.config
      });
      setBuckets(originalBuckets);
      alert(err?.response?.data?.title || err?.message || 'Failed to move plan');
    }
  }, [plans, svc, onPlanUpdate]);

  return (
    <MuiBox sx={{ 
      maxWidth: '100%',
      bgcolor: 'grey.50',
      borderRadius: 2,
      p: 2,
      border: '1px solid',
      borderColor: 'grey.200'
    }}>
      {/* Mobile View Indicator */}
      {isMobile && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            📱 Mobile View
          </Typography>
        </Stack>
      )}

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <WeekGrid
          dayKeys={dayKeys}
          buckets={buckets}
          lookupMaps={lookupMaps}
          isMobile={isMobile}
          onEdit={handleEdit}
          onView={handleView}
        />
      </DragDropContext>
    </MuiBox>
  );
}