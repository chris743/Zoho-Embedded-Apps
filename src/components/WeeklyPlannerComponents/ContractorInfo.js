import { Typography, Box } from "@mui/material";
import { memo } from "react";
import BusinessIcon from "@mui/icons-material/Business"

export const ContractorInfo = memo(({ name }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.4,
    pt: 0.3,
    borderTop: '1px solid',
    borderColor: 'grey.100'
  }}>
    <BusinessIcon sx={{ fontSize: 14, color: 'grey.500' }} />
    <Typography 
      variant="caption" 
      sx={{ 
        color: 'grey.600',
        fontSize: '0.7rem',
        fontWeight: 500
      }}
    >
      {name}
    </Typography>
  </Box>
));

ContractorInfo.displayName = 'ContractorInfo';