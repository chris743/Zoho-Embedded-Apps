import { memo } from "react";
import { Paper } from "@mui/material";
import { DayHeader } from "./DayHeader";
import { DropZone } from "./DropZone";

export const DayColumn = memo(({ ymd, dateObj, cards, onEdit, onView, isWeekend }) => (
  <Paper
    elevation={0}
    sx={{
      height: 'fit-content',
      minHeight: 400,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'grey.200',
      bgcolor: isWeekend ? 'grey.25' : 'white',
      overflow: 'hidden'
    }}
  >
    <DayHeader dateObj={dateObj} isWeekend={isWeekend} />
    <DropZone ymd={ymd} cards={cards} onEdit={onEdit} onView={onView} />
  </Paper>
), (prev, next) => 
  prev.ymd === next.ymd && 
  prev.cards === next.cards && 
  prev.dateObj.getTime() === next.dateObj.getTime() &&
  prev.isWeekend === next.isWeekend
);

DayColumn.displayName = 'DayColumn';