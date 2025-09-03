import React from "react";
import {
  Paper,
  Typography,
  Box,
  Chip
} from "@mui/material";
import { commonStyles } from "../../../utils/theme";
import { getCommodityColor, getContrastColor } from "../../../utils/theme";
import { KV } from "../KV";

/**
 * Block information section showing block details and commodity
 */
export function BlockInformationSection({ block, commodityName }) {
  return (
    <Paper elevation={0} sx={{ 
      ...commonStyles.section, 
      flex: 1,
      height: '450px',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Typography variant="h6" sx={{ ...commonStyles.sectionTitle, mb: 1.5, fontSize: '0.95rem', flexShrink: 0 }}>
        Block Information
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 0, overflow: 'auto' }}>
        <KV label="Block Name" value={block?.NAME ?? block?.name} />
        <KV label="Grower" value={block?.GrowerName ?? block?.growerName} />
        <KV label="District" value={block?.DISTRICT ?? block?.district} />
        <KV label="Block ID" value={block?.id} />
        <KV label="GABLOCKIDX" value={block?.GABLOCKIDX ?? block?.gablockidx} />
        <KV label="Acres" value={block?.ACRES ?? '-'} />
        <Box sx={{ flexShrink: 0 }}>
          <Typography variant="caption" sx={{ ...commonStyles.fieldLabel, display: 'block', mb: 0.5 }}>
            Commodity
          </Typography>
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
              }}
            />
          ) : (
            <Typography variant="body2" sx={commonStyles.fieldValue}>
              -
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
