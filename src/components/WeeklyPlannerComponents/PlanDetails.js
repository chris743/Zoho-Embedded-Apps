import { memo } from "react";
import { Stack, Chip, Typography, IconButton } from "@mui/material";
import { formatBinInfo } from "./utils/dataUtils";
import AgricultureIcon from '@mui/icons-material/Agriculture';
import InfoIcon from '@mui/icons-material/Info'

export const PlanDetails = memo(({ commodityName, plannedBins, actualBins, estimatedBins }) => (
  <Stack spacing={1}>
    {commodityName && (
      <Chip 
        size="small" 
        label={commodityName}
        icon={<AgricultureIcon />}
        sx={{
          height: 28,
          fontSize: '0.75rem',
          fontWeight: 500,
          bgcolor: 'success.50',
          color: 'success.800',
          border: '1px solid',
          borderColor: 'success.200',
          '& .MuiChip-icon': {
            fontSize: 16,
            color: 'success.600'
          }
        }}
      />
    )}
    {(plannedBins != null || actualBins != null) && (
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'grey.600',
          fontSize: '0.75rem',
          fontWeight: 500
        }}
      >
        {formatBinInfo(plannedBins, actualBins, estimatedBins)}
      </Typography>
    )}
  </Stack>
));

PlanDetails.displayName = 'PlanDetails';