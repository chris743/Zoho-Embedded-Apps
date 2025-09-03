import { Typography, Box } from "@mui/material";
import { memo } from "react";
import { weekdayShort } from "./utils/dateUtils";
import { toYMD } from "./utils/dateUtils";

export const DayHeader = memo(({ dateObj, isWeekend }) => {
  const isToday = toYMD(dateObj) === toYMD(new Date());
  
  return (
    <Box sx={{ 
      p: 0,
      bgcolor: isToday 
        ? 'primary.50' 
        : isWeekend 
          ? 'grey.50' 
          : 'grey.25',
      borderBottom: '1px solid',
      borderColor: isToday ? 'primary.200' : 'grey.200'
    }}>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 600,
          color: isToday ? 'primary.800' : 'grey.800',
          textAlign: 'center',
          fontSize: '0.875rem',
          letterSpacing: '0.025em'
        }}
      >
        {weekdayShort(dateObj).toUpperCase()}, {dateObj.getDate()}
      </Typography>
    </Box>
  );
});

DayHeader.displayName = 'DayHeader';