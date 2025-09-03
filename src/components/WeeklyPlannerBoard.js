import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box, Paper, Typography, Chip, Card, CardContent, Stack
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getCommodityColor, getContrastColor } from "../utils/theme";

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
    <Paper elevation={0} sx={{ 
      p: 2.5, 
      bgcolor: 'background.paper',
      border: '1px solid #E8EBF0',
      borderRadius: 2 
    }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(7, 1fr)", 
          gap: 1.5, 
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



// Optimized day column with better memoization
const DayColumn = React.memo(({ ymd, dateObj, cards, onEdit }) => {
  const isToday = new Date().toDateString() === dateObj.toDateString();
  
  return (
    <Box>
      <Box sx={{ 
        p: 1, 
        mb: 1, 
        borderRadius: 1.5,
        bgcolor: isToday ? 'primary.main' : 'background.surface',
        color: isToday ? 'white' : 'text.primary',
        textAlign: 'center',
        border: '1px solid #E8EBF0'
      }}>
        <Typography variant="caption" fontSize="0.75rem" fontWeight={600}>
          {weekdayShort(dateObj)}
        </Typography>
        <Typography variant="body2" fontSize="0.9rem" fontWeight={500}>
          {dateObj.getDate()}
        </Typography>
      </Box>
      
      <Droppable droppableId={ymd}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 160,
              p: 0.75,
              borderRadius: 2,
              border: '2px dashed #E0E4E7',
              bgcolor: snapshot.isDraggingOver 
                ? 'rgba(66, 133, 244, 0.08)' 
                : 'transparent',
              borderColor: snapshot.isDraggingOver 
                ? 'primary.main' 
                : '#E0E4E7',
              transition: "all 120ms ease-in-out"
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
const PlanCard = React.memo(({ plan, index, onEdit }) => {
  const commodityColor = getCommodityColor(plan._card.commodityName);
  
  return (
    <Draggable draggableId={String(plan.id)} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={0}
          sx={{
            mb: 0.75,
            border: '1px solid #E8EBF0',
            borderRadius: 2,
            cursor: "grab",
            transition: "all 120ms ease-in-out",
            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
            boxShadow: snapshot.isDragging 
              ? '0px 8px 24px rgba(0,0,0,0.15)' 
              : '0px 1px 3px rgba(0,0,0,0.08)',
            "&:hover": {
              boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
              borderColor: '#C4C9CF',
            },
            "&:active": { cursor: "grabbing" }
          }}
          onClick={() => onEdit(plan)}
        >
          <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
            <Stack spacing={0.5}>
              <Typography 
                variant="body2" 
                fontSize="0.8rem" 
                fontWeight={600} 
                color="text.primary"
                noWrap
              >
                {plan._card.blockName}
              </Typography>
              
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                {plan._card.commodityName && (
                  <Chip 
                    size="small" 
                    label={plan._card.commodityName}
                    sx={{
                      height: 20,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      backgroundColor: commodityColor,
                      color: getContrastColor(commodityColor),
                      border: `1px solid ${commodityColor}`,
                      "& .MuiChip-label": { px: 0.75 }
                    }}
                  />
                )}
                <Typography variant="caption" fontSize="0.7rem" color="text.secondary" noWrap>
                  {formatBinInfo(plan.planned_bins, plan.bins)}
                </Typography>
              </Stack>
              
              {plan._card.contractorName && (
                <Typography variant="caption" fontSize="0.7rem" color="text.secondary" noWrap>
                  👤 {plan._card.contractorName}
                </Typography>
              )}
              
              {plan._card.grower && (
                <Typography variant="caption" fontSize="0.65rem" color="text.disabled" noWrap>
                  🏪 {plan._card.grower}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
});

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

