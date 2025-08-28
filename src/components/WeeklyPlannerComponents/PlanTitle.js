import { memo } from "react";
import { Typography, Box } from "@mui/material";
export const PlanTitle = memo(({ blockName, grower, blockID }) => (
  <Box>
    <Typography 
      variant="subtitle1" 
      sx={{ 
        fontWeight: 600,
        color: 'grey.900',
        lineHeight: 1.2,
        mb: grower ? 0.5 : 0
      }}
      noWrap
    >
      {blockName}
    </Typography>
    {grower && (
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'grey.600',
          fontSize: '0.875rem'
        }}
        noWrap
      >
        {blockID}
      </Typography>
    )}
  </Box>
));

PlanTitle.displayName = 'PlanTitle';