import React, { useMemo } from "react";
import {
  Stack,
  IconButton,
  Typography
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";

// Helper functions
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function sevenDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatRangeLabel(start, end) {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export function WeekPicker({ weekStart, onWeekChange }) {
  const start = useMemo(() => startOfWeek(weekStart || new Date()), [weekStart]);
  const days = useMemo(() => sevenDays(start), [start]);

  const handleWeekChange = useMemo(() => ({
    prev: () => onWeekChange?.(addDays(start, -7)),
    next: () => onWeekChange?.(addDays(start, 7)),
    today: () => onWeekChange?.(startOfWeek(new Date()))
  }), [onWeekChange, start]);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ minWidth: 140 }}>
        Week of {formatRangeLabel(days[0], days[6])}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton 
          size="small" 
          onClick={handleWeekChange.prev} 
          aria-label="Previous week"
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid #E0E4E7',
            '&:hover': { bgcolor: '#E8EBF0' }
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={handleWeekChange.today} 
          aria-label="Current week"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          <TodayIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={handleWeekChange.next} 
          aria-label="Next week"
          sx={{
            bgcolor: 'background.surface',
            border: '1px solid #E0E4E7',
            '&:hover': { bgcolor: '#E8EBF0' }
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}
