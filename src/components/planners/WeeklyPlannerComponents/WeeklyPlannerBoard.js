import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Box as MuiBox, useMediaQuery, useTheme, Stack, Typography } from "@mui/material";
import { DragDropContext } from "@hello-pangea/dnd";
import { useViewMode } from "../../../contexts/ViewModeContext";
import { startOfWeek, sevenDays, toYMD } from "../../../utils/dateUtils";
import { createBlockMap, createContractorMap, createCommodityMap, buildBuckets } from "../../../utils/dataUtils";
import { WeekGrid } from "./WeekGrid";
import CopyHarvestPlansDialog from "./CopyHarvestPlansDialog";

export function WeeklyPlannerBoard({
  plans = [],
  blocks = [],
  contractors = [],
  commodities = [],
  fieldRepresentatives = [],
  binsReceived = [],
  onEdit,
  onView,
  svc,
  weekStart,
  onWeekChange,
  onPlanUpdate,
  onRefresh,
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

  // State management
  const [buckets, setBuckets] = useState({});
  const isDraggingRef = useRef(false);
  const lastPlansIdsRef = useRef(new Set());
  const lastDayKeysRef = useRef([]);
  const [copyDialogState, setCopyDialogState] = useState({ open: false, targetDate: null });

  // Build buckets when plans change (but not during drag operations)
  useEffect(() => {
    if (!isDraggingRef.current) {
      // Check if plans actually changed by comparing IDs
      const currentPlanIds = new Set((plans || []).map(p => String(p.id)));
      const lastPlanIds = lastPlansIdsRef.current;
      
      // Only process if plans actually changed
      const plansChanged = currentPlanIds.size !== lastPlanIds.size ||
        [...currentPlanIds].some(id => !lastPlanIds.has(id)) ||
        [...lastPlanIds].some(id => !currentPlanIds.has(id));
      
      // Also check if dayKeys changed (week navigation)
      const dayKeysStr = JSON.stringify(dayKeys);
      const lastDayKeysStr = JSON.stringify(lastDayKeysRef.current);
      const dayKeysChanged = dayKeysStr !== lastDayKeysStr;
      
      if (!plansChanged && !dayKeysChanged && lastPlanIds.size > 0) {
        return; // No changes, skip update
      }
      
      // Update refs
      lastPlansIdsRef.current = currentPlanIds;
      lastDayKeysRef.current = dayKeys;
      
      const newBuckets = buildBuckets(plans, dayKeys, lookupMaps, binsReceived);
      
      // Only update state if buckets actually changed
      setBuckets(prevBuckets => {
        // Quick comparison - check if structure changed
        const prevKeys = Object.keys(prevBuckets).sort();
        const newKeys = Object.keys(newBuckets).sort();
        
        if (prevKeys.length !== newKeys.length || 
            !prevKeys.every(key => newKeys.includes(key))) {
          return newBuckets;
        }
        
        // Check if any bucket contents changed
        const hasChanges = prevKeys.some(key => {
          const prevPlans = prevBuckets[key] || [];
          const newPlans = newBuckets[key] || [];
          if (prevPlans.length !== newPlans.length) return true;
          return prevPlans.some((p, i) => String(p.id) !== String(newPlans[i]?.id));
        });
        
        return hasChanges ? newBuckets : prevBuckets;
      });
    }
  }, [plans, dayKeys, lookupMaps, binsReceived]);

  // Event handlers
  const handleEdit = useCallback((plan) => {
    onEdit?.(plan);
  }, [onEdit]);

  const handleView = useCallback((plan) => {
    onView?.(plan);
  }, [onView]);

  // Copy plans dialog handlers
  const handleOpenCopyDialog = useCallback((targetDate) => {
    setCopyDialogState({ open: true, targetDate });
  }, []);

  const handleCloseCopyDialog = useCallback(() => {
    setCopyDialogState({ open: false, targetDate: null });
  }, []);

  const handleCopyPlans = useCallback(async (selectedPlans, targetDate) => {
    try {
      // Convert target date to ISO string
      const targetDateISO = new Date(targetDate).toISOString();

      // Create new plans for each selected plan
      const createPromises = selectedPlans.map(async (plan) => {
        const newPlanData = {
          date: targetDateISO,
          grower_block_source_database: plan.grower_block_source_database,
          grower_block_id: plan.grower_block_id,
          bins: plan.bins ?? plan.planned_bins,
          planned_bins: plan.bins ?? plan.planned_bins,
          contractor_id: plan.contractor_id,
          forklift_contractor_id: plan.forklift_contractor_id,
          hauler_id: plan.hauler_id,
          pool_id: plan.pool_id,
          deliver_to: plan.deliver_to,
          field_representative_id: plan.field_representative_id,
          notes_general: plan.notes_general,
          notes_specific: plan.notes_specific
        };

        return svc.create(newPlanData);
      });

      await Promise.all(createPromises);

      // Close dialog
      handleCloseCopyDialog();

      // Refresh data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to copy plans:', err);
      alert(err?.response?.data?.title || err?.message || 'Failed to copy plans');
    }
  }, [svc, onRefresh, handleCloseCopyDialog]);

  // DRAG AND DROP - SIMPLIFIED
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    // Reset dragging flag after a short delay to allow state updates
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
    
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
    
    // Store original buckets for potential revert using functional update
    let originalBuckets = {};
    setBuckets(prev => {
      originalBuckets = { ...prev };
      return prev;
    });
    
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
      
      // Success - refresh data quietly
      if (onRefresh) {
        await onRefresh();
      }
      
      // Update parent component state to reflect the change
      if (onPlanUpdate) {
        onPlanUpdate(updateId, { date: newDate });
      }
    } catch (err) {
      // Revert optimistic update on error
      console.error(" Move failed:", err);
      console.error(" Error details:", {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        config: err?.config
      });
      setBuckets(originalBuckets);
      alert(err?.response?.data?.title || err?.message || 'Failed to move plan');
    }
  }, [plans, svc, onPlanUpdate, onRefresh]);

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
            Mobile View
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
          onCopyFromPrevious={handleOpenCopyDialog}
        />
      </DragDropContext>

      {/* Copy Plans Dialog */}
      <CopyHarvestPlansDialog
        open={copyDialogState.open}
        onClose={handleCloseCopyDialog}
        targetDate={copyDialogState.targetDate}
        allPlans={plans}
        onCopyPlans={handleCopyPlans}
      />
    </MuiBox>
  );
}