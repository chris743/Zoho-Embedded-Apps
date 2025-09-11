import { startOfWeek, sevenDays, toYMD } from "../../../utils/dateUtils";
import { createBlockMap, createContractorMap, createCommodityMap, buildBuckets } from "../../../utils/dataUtils";

import { WeekGrid } from "./WeekGrid";
import { DayColumn } from "./DayColumn";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box as MuiBox, useMediaQuery, useTheme, Stack, Typography, Box } from "@mui/material";
import { useViewMode } from "../../../contexts/ViewModeContext";

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
}) {
  const theme = useTheme();
  const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { viewMode } = useViewMode();
  
  // Determine if we should use mobile layout
  const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);
  // Memoized week calculations
  const start = useMemo(() => startOfWeek(weekStart || new Date()), [weekStart]);
  const days = useMemo(() => sevenDays(start), [start]);
  const dayKeys = useMemo(() => days.map(toYMD), [days]);

  // Stable lookup maps
  const lookupMaps = useMemo(() => ({
    blocks: createBlockMap(blocks),
    contractors: createContractorMap(contractors),
    commodities: createCommodityMap(commodities)
  }), [blocks, contractors, commodities]);

  // State management
  const [buckets, setBuckets] = useState(() => ({}));

  // Build buckets when week or plans change
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



  const handleDragEnd = useCallback(async ({ source, destination, draggableId }) => {
    if (!destination || 
        (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const srcKey = source.droppableId;
    const dstKey = destination.droppableId;
    
    // Optimistic update
    setBuckets(prev => {
      const srcCards = prev[srcKey] || [];
      const movedCard = srcCards[source.index];
      if (!movedCard) return prev;

      const newBuckets = { ...prev };
      
      // Update source array
      newBuckets[srcKey] = srcCards.filter((_, i) => i !== source.index);
      
      // Update destination array
      const dstCards = srcKey === dstKey ? newBuckets[srcKey] : [...(prev[dstKey] || [])];
      const updatedCard = {
        ...movedCard,
        date: new Date(dstKey + "T00:00:00").toISOString()
      };
      
      dstCards.splice(destination.index, 0, updatedCard);
      newBuckets[dstKey] = dstCards;

      return newBuckets;
    });

    // Persist to server
    try {
      const newDate = new Date(destination.droppableId + "T00:00:00").toISOString();
      await svc.update(draggableId, { date: newDate });
    } catch (err) {
      console.error("Move failed:", err);
      // Revert on error
      const revertedBuckets = buildBuckets(plans, dayKeys, lookupMaps);
      setBuckets(revertedBuckets);
      
      const errorMsg = err?.response?.data?.title || err?.message || "Failed to move plan";
      alert(errorMsg);
    }
  }, [plans, dayKeys, lookupMaps, svc]);

  return (
    <MuiBox sx={{ 
      maxWidth: '100%',
      bgcolor: 'grey.50',
      minHeight: '100vh',
      p: 0
    }}>
      {isMobile ? (
        // Mobile: Vertical stack of day columns
        <Box sx={{ 
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'primary.200'
        }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'primary.main' }}>
            📱 Mobile View - Weekly Harvest Plans
          </Typography>
          <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
            {days.map((day) => {
              const ymd = toYMD(day);
              const cards = buckets[ymd] || [];
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <DayColumn 
                  key={ymd}
                  ymd={ymd}
                  dateObj={day}
                  cards={cards}
                  onEdit={handleEdit}
                  onView={handleView}
                  isWeekend={isWeekend}
                  isMobile={true}
                />
              );
            })}
          </Stack>
        </Box>
      ) : (
        // Desktop: Grid layout
        <WeekGrid 
          days={days}
          buckets={buckets}
          onEdit={handleEdit}
          onView={handleView}
          onDragEnd={handleDragEnd}
        />
      )}
    </MuiBox>
  );
}