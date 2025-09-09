import { memo } from "react";
import { Stack, Chip, Typography } from "@mui/material";
import { formatBinInfo } from "../../../utils/dataUtils";
import { getCommodityColor, getContrastColor } from "../../../utils/theme";

export const PlanDetails = memo(({ commodityName, plannedBins, actualBins, estimatedBins }) => (
  <Stack spacing={0.8}>
    {commodityName ? (
      <Chip
        label={commodityName}
        size="small"
        sx={{
          backgroundColor: getCommodityColor(commodityName),
          color: getContrastColor(getCommodityColor(commodityName)),
          fontWeight: 500,
          fontSize: '0.7rem',
          height: 22,
          width: 'fit-content'
        }}
      />
    ) : null}
    {(plannedBins != null || actualBins != null) && (
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'grey.600',
          fontSize: '0.7rem',
          fontWeight: 500
        }}
      >
        {formatBinInfo(plannedBins, actualBins, estimatedBins)}
      </Typography>
    )}
  </Stack>
));

PlanDetails.displayName = 'PlanDetails';