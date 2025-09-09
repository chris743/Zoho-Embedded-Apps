import React, { memo } from 'react';
import {
  Box, Typography, IconButton, Divider, Paper
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import { formatRangeLabel } from '../../../utils/dateUtils';

export const WeekHeader = memo(({ days, onWeekChange }) => (
  <Box sx={{ mb: 3 }}>
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200'
      }}
    >
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between"
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            color: 'grey.800',
            letterSpacing: '-0.025em'
          }}
        >
          Week of {formatRangeLabel(days[0], days[6])}
        </Typography>
        
        <Box sx={{ 
          display: 'flex',
          bgcolor: 'white',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'hidden'
        }}>
          <IconButton 
            onClick={onWeekChange.prev} 
            aria-label="Previous week"
            sx={{ 
              borderRadius: 0,
              px: 2,
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Divider orientation="vertical" flexItem />
          <IconButton 
            onClick={onWeekChange.today} 
            aria-label="Current week"
            sx={{ 
              borderRadius: 0,
              px: 2,
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <TodayIcon />
          </IconButton>
          <Divider orientation="vertical" flexItem />
          <IconButton 
            onClick={onWeekChange.next} 
            aria-label="Next week"
            sx={{ 
              borderRadius: 0,
              px: 2,
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  </Box>
));

WeekHeader.displayName = 'WeekHeader';