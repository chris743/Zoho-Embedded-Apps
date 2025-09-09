import { DragDropContext } from "@hello-pangea/dnd";
import { memo } from "react";
import { DayColumn } from "./DayColumn";
import { Box } from "@mui/material";
import { toYMD } from "../../../utils/dateUtils";

export const WeekGrid = memo(({ days, buckets, onEdit, onView, onDragEnd }) => (
  <DragDropContext onDragEnd={onDragEnd}>
    <Box sx={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(7, 1fr)", 
      gap: 2,
      alignItems: "stretch" // Makes all columns same height
    }}>
      {days.map((day) => {
        const ymd = toYMD(day);
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
          />
        );
      })}
    </Box>
  </DragDropContext>
));

WeekGrid.displayName = 'WeekGrid';