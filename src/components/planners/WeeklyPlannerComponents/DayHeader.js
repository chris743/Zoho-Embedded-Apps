import { Typography, Box, IconButton, Tooltip } from "@mui/material";
import { memo } from "react";
import AddIcon from "@mui/icons-material/Add";
import { weekdayShort, toYMD } from "../../../utils/dateUtils";

export const DayHeader = memo(({ dateObj, isWeekend, onCopyFromPrevious }) => {
  const isToday = toYMD(dateObj) === toYMD(new Date());
  
  // Safely get date number
  const getDateNumber = (date) => {
    try {
      return date instanceof Date ? date.getDate() : new Date(date).getDate();
    } catch (error) {
      return 1; // fallback
    }
  };
  
  return (
    <Box sx={{
      p: 0,
      bgcolor: isToday
        ? 'primary.50'
        : isWeekend
          ? 'grey.50'
          : 'grey.25',
      borderBottom: '1px solid',
      borderColor: isToday ? 'primary.200' : 'grey.200',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 1,
      py: 0.5
    }}>
      {/* Spacer for alignment */}
      <Box sx={{ width: 32 }} />

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          color: isToday ? 'primary.800' : 'grey.800',
          textAlign: 'center',
          fontSize: '0.875rem',
          letterSpacing: '0.025em',
          flex: 1
        }}
      >
        {weekdayShort(dateObj).toUpperCase()}, {getDateNumber(dateObj)}
      </Typography>

      {/* Plus button to copy from previous day */}
      {onCopyFromPrevious && (
        <Tooltip title="Copy from Previous Day">
          <IconButton
            size="small"
            onClick={() => onCopyFromPrevious(dateObj)}
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.300',
              '&:hover': {
                bgcolor: 'primary.50',
                borderColor: 'primary.300'
              }
            }}
          >
            <AddIcon fontSize="small" sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
});

DayHeader.displayName = 'DayHeader';