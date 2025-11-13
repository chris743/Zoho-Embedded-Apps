import { memo } from "react";
import { Paper } from "@mui/material";
import { DayHeader } from "./DayHeader";
import { DropZone } from "./DropZone";

export const DayColumn = memo(({ ymd, dateObj, cards, onEdit, onView, isWeekend, isMobile = false, onCopyFromPrevious }) => (
  <Paper
    elevation={isMobile ? 3 : 0}
    sx={{
      height: 'fit-content',
      minHeight: isMobile ? 200 : 400,
      borderRadius: isMobile ? 3 : 2,
      border: isMobile ? '2px solid' : '1px solid',
      borderColor: isMobile ? 'primary.300' : 'grey.200',
      bgcolor: isMobile ? 'primary.50' : (isWeekend ? 'grey.25' : 'white'),
      overflow: 'visible',
      boxShadow: isMobile ? 2 : 'none'
    }}
  >
    <DayHeader dateObj={dateObj} isWeekend={isWeekend} onCopyFromPrevious={onCopyFromPrevious} />
    <DropZone ymd={ymd} cards={cards} onEdit={onEdit} onView={onView} />
  </Paper>
), (prev, next) =>
  prev.ymd === next.ymd &&
  prev.cards === next.cards &&
  prev.dateObj.getTime() === next.dateObj.getTime() &&
  prev.isWeekend === next.isWeekend &&
  prev.isMobile === next.isMobile &&
  prev.onCopyFromPrevious === next.onCopyFromPrevious
);

DayColumn.displayName = 'DayColumn';