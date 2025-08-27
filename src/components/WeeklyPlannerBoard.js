import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box, Paper, Typography, IconButton, Chip, Card, CardContent, Stack, Divider
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";

export function WeeklyPlannerBoard({
  plans = [],
  blocks = [],
  contractors = [],
  commodities = [],
  onEdit,
  svc,
  weekStart,
  onWeekChange,
}) {
  const start = useMemo(() => startOfWeek(weekStart || new Date()), [weekStart]);
  const days = useMemo(() => sevenDays(start), [start]);
  const dayKeys = useMemo(() => days.map(toYMD), [days]);

  // Stable lookup maps
  const lookupMaps = useMemo(() => ({
    blocks: createBlockMap(blocks),
    contractors: createContractorMap(contractors),
    commodities: createCommodityMap(commodities)
  }), [blocks, contractors, commodities]);

  // Optimized buckets state - only updates when plans actually change
  const [buckets, setBuckets] = useState(() => ({}));
  const bucketsRef = useRef(buckets);
  bucketsRef.current = buckets;

  // Build buckets when week or plans change
  useEffect(() => {
    const newBuckets = buildBuckets(plans, dayKeys, lookupMaps);
    setBuckets(newBuckets);
  }, [plans, dayKeys, lookupMaps]);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleEdit = useCallback((plan) => {
    onEdit?.(plan);
  }, [onEdit]);

  const handleWeekChange = useMemo(() => ({
    prev: () => onWeekChange?.(addDays(start, -7)),
    next: () => onWeekChange?.(addDays(start, 7)),
    today: () => onWeekChange?.(startOfWeek(new Date()))
  }), [onWeekChange, start]);

  // Optimized drag handler with minimal state updates
  const onDragEnd = useCallback(async ({ source, destination, draggableId }) => {
    if (!destination || 
        (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const srcKey = source.droppableId;
    const dstKey = destination.droppableId;
    
    // Optimistic update with minimal object creation
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

    // Persist to server with error handling
    try {
      const newDate = new Date(destination.droppableId + "T00:00:00").toISOString();
      await svc.update(draggableId, { date: newDate });
    } catch (err) {
      console.error("Move failed:", err);
      // Revert on error by rebuilding from plans
      const revertedBuckets = buildBuckets(plans, dayKeys, lookupMaps);
      setBuckets(revertedBuckets);
      
      const errorMsg = err?.response?.data?.title || err?.message || "Failed to move plan";
      alert(errorMsg);
    }
  }, [plans, dayKeys, lookupMaps, svc]);

  return (
    <Paper sx={{ p: 2 }}>
      <WeekHeader 
        days={days} 
        onWeekChange={handleWeekChange}
      />
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(7, 1fr)", 
          gap: 2, 
          alignItems: "flex-start" 
        }}>
          {days.map((day) => {
            const ymd = toYMD(day);
            const cards = buckets[ymd] || [];
            return (
              <DayColumn 
                key={ymd}
                ymd={ymd}
                dateObj={day}
                cards={cards}
                onEdit={handleEdit}
              />
            );
          })}
        </Box>
      </DragDropContext>
    </Paper>
  );
}

// Extracted header component for better separation of concerns
const WeekHeader = React.memo(({ days, onWeekChange }) => (
  <>
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      mb: 1 
    }}>
      <Typography variant="h6">
        Week of {formatRangeLabel(days[0], days[6])}
      </Typography>
      <Box>
        <IconButton onClick={onWeekChange.prev} aria-label="Previous week">
          <ChevronLeftIcon />
        </IconButton>
        <IconButton onClick={onWeekChange.today} aria-label="Current week">
          <TodayIcon />
        </IconButton>
        <IconButton onClick={onWeekChange.next} aria-label="Next week">
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
    <Divider sx={{ mb: 2 }} />
  </>
));

// Optimized day column with better memoization
const DayColumn = React.memo(({ ymd, dateObj, cards, onEdit }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      {weekdayShort(dateObj)} {dateObj.getMonth() + 1}/{dateObj.getDate()}
    </Typography>
    <Droppable droppableId={ymd}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={{
            minHeight: 200,
            p: 1,
            borderRadius: 2,
            bgcolor: snapshot.isDraggingOver ? "action.hover" : "background.default",
            transition: "background-color 120ms ease-in-out"
          }}
        >
          {cards.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              onEdit={onEdit}
            />
          ))}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  </Box>
), (prev, next) => 
  prev.ymd === next.ymd && 
  prev.cards === next.cards && 
  prev.dateObj.getTime() === next.dateObj.getTime()
);

// Extracted plan card component for better performance
const PlanCard = React.memo(({ plan, index, onEdit }) => (
  <Draggable draggableId={String(plan.id)} index={index}>
    {(provided, snapshot) => (
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        variant="outlined"
        sx={{
          mb: 1.25,
          boxShadow: snapshot.isDragging ? 4 : 0,
          borderRadius: 2,
          cursor: "grab",
          transition: "box-shadow 120ms ease-in-out",
          "&:active": { cursor: "grabbing" }
        }}
        onClick={() => onEdit(plan)}
      >
        <CardContent sx={{ p: 1.25 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" noWrap>
              {plan._card.blockName}
              {plan._card.grower && ` — ${plan._card.grower}`}
            </Typography>
            
            <Stack direction="row" spacing={1} alignItems="center">
              {plan._card.commodityName && (
                <Chip size="small" label={plan._card.commodityName} />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatBinInfo(plan.planned_bins, plan.bins)}
              </Typography>
            </Stack>
            
            {plan._card.contractorName && (
              <Typography variant="caption" color="text.secondary">
                {plan._card.contractorName}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    )}
  </Draggable>
));

/* ---------- Helper Functions ---------- */

function createBlockMap(blocks) {
  const map = new Map();
  for (const block of blocks || []) {
    const src = block.source_database ?? block.sourceDatabase;
    const idx = block.GABLOCKIDX ?? block.gablockidx ?? block.id;
    if (src != null && idx != null) {
      map.set(`${src}:${idx}`, block);
    }
  }
  return map;
}

function createContractorMap(contractors) {
  const map = new Map();
  for (const contractor of contractors || []) {
    const id = contractor.id ?? contractor.ID ?? contractor.contractor_id;
    if (id != null) {
      map.set(Number(id), contractor);
    }
  }
  return map;
}

function createCommodityMap(commodities) {
  const map = new Map();
  for (const commodity of commodities || []) {
    const src = (commodity.source_database ?? commodity.SOURCE_DATABASE ?? "")
      .toString().toLowerCase();
    if (src && src !== "cobblestone") continue;
    
    const idx = commodity.CMTYIDX ?? commodity.cmtyidx ?? commodity.id ?? commodity.code;
    const name = commodity.DESCR ?? commodity.descr ?? commodity.name ?? 
                 commodity.NAME ?? String(idx ?? "");
    
    if (idx != null) {
      map.set(String(idx), String(name));
    }
  }
  return map;
}

function enrichPlan(plan, { blocks, contractors, commodities }) {
  const blockKey = `${plan.grower_block_source_database}:${plan.grower_block_id}`;
  const block = blocks.get(blockKey);
  const contractor = contractors.get(plan.contractor_id ?? -1);
  const commodityIdx = block?.CMTYIDX ?? block?.cmtyidx ?? block?.VARIETYIDX ?? null;
  const commodityName = commodityIdx != null ? 
    (commodities.get(String(commodityIdx)) ?? "") : "";

  return {
    ...plan,
    _card: {
      blockName: block?.NAME ?? block?.name ?? `${plan.grower_block_id}`,
      grower: block?.GrowerName ?? block?.growerName ?? "",
      commodityName,
      contractorName: contractor?.name ?? contractor?.NAME ?? "",
    }
  };
}

function buildBuckets(plans, dayKeys, lookupMaps) {
  const buckets = {};
  
  // Initialize empty buckets
  for (const key of dayKeys) {
    buckets[key] = [];
  }
  
  // Populate buckets with enriched plans
  for (const plan of plans || []) {
    const ymd = toYMD(plan.date);
    if (buckets[ymd]) {
      buckets[ymd].push(enrichPlan(plan, lookupMaps));
    }
  }
  
  // Sort each day's plans
  for (const key of dayKeys) {
    buckets[key].sort((a, b) => 
      (a._card.blockName || "").localeCompare(b._card.blockName || "")
    );
  }
  
  return buckets;
}

function formatBinInfo(planned, actual) {
  const parts = [];
  if (planned != null) parts.push(`Planned: ${planned}`);
  if (actual != null) parts.push(`Actual: ${actual}`);
  return parts.join(" · ");
}

// Date utility functions
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sevenDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function weekdayShort(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date).getDay()];
}

function formatRangeLabel(start, end) {
  const format = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${format(start)} – ${format(end)}`;
}