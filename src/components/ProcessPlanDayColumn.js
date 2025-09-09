import { memo } from "react";
import { Paper } from "@mui/material";
import { DayHeader } from "./planners/WeeklyPlannerComponents/DayHeader";
import { ProcessPlanDropZone } from "./ProcessPlanDropZone";

export const ProcessPlanDayColumn = memo(({ ymd, dateObj, cards, onEdit, onView, isWeekend }) => (
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
    <ProcessPlanDropZone ymd={ymd} cards={cards} onEdit={onEdit} onView={onView} />
  </Paper>
); // Remove memo comparison temporarily to debug

ProcessPlanDayColumn.displayName = 'ProcessPlanDayColumn';