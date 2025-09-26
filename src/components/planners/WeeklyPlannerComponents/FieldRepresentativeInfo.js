import { Typography, Box } from "@mui/material";
import { memo } from "react";
import PersonIcon from "@mui/icons-material/Person"

export const FieldRepresentativeInfo = memo(({ name }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.4,
    pt: 0.3,
    borderTop: '1px solid',
    borderColor: 'grey.100'
  }}>
    <PersonIcon sx={{ fontSize: 14, color: 'grey.500' }} />
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

FieldRepresentativeInfo.displayName = 'FieldRepresentativeInfo';
