import { memo } from "react";
import { DayColumn } from "./DayColumn";
import { Box } from "@mui/material";
// No dateUtils imports needed since we're working with dayKeys directly

export const WeekGrid = memo(({ dayKeys, buckets, isMobile, onEdit, onView }) => {
  // Convert dayKeys back to Date objects for the grid
  const days = dayKeys ? dayKeys.map(ymd => new Date(ymd + "T00:00:00")) : [];
  
  return (
    <Box sx={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(7, 1fr)", 
      gap: 2,
      alignItems: "stretch" // Makes all columns same height
    }}>
      {days.map((day) => {
        const ymd = dayKeys[days.indexOf(day)];
        const cards = buckets[ymd] || [];
        
        // Safely get day of week
        const getDayOfWeek = (date) => {
          try {
            return date instanceof Date ? date.getDay() : new Date(date).getDay();
          } catch (error) {
            return 1; // fallback to Monday
          }
        };
        
        const isWeekend = getDayOfWeek(day) === 0 || getDayOfWeek(day) === 6;
        
        return (
          <DayColumn 
            key={ymd}
            ymd={ymd}
            dateObj={day}
            cards={cards}
            onEdit={onEdit}
            onView={onView}
            isWeekend={isWeekend}
            isMobile={isMobile}
          />
        );
      })}
    </Box>
  );
});

WeekGrid.displayName = 'WeekGrid';