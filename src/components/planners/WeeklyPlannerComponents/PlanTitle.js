import { memo } from "react";
import { Typography, Box } from "@mui/material";
export const PlanTitle = memo(({ blockName, grower, blockID }) => (
  <Box>
    <Typography 
      variant="subtitle1" 
      sx={{ 
        fontWeight: 600,
        fontSize: '0.8rem',
        color: 'grey.900',
        lineHeight: 1.1,
        mb: grower ? 0.3 : 0
      }}
      
    >
      {blockName}
    </Typography>
    {grower && (
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'grey.600',
          fontSize: '0.7rem'
        }}
        noWrap
      >
        {blockID}
      </Typography>
    )}
  </Box>
));

PlanTitle.displayName = 'PlanTitle';