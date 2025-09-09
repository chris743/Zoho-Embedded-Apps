import React from "react";
import {
  Paper,
  Typography,
  Box
} from "@mui/material";
import { commonStyles } from "../../../utils/theme";
import { KV } from "../KV";
import { formatRate } from "../../../utils/dataUtils";

/**
 * Resource allocation section showing contractor and rate information
 */
export function ResourceAllocationSection({ plan, labor, forklift, hauler }) {
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
        Resource Allocation
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 0, overflow: 'auto' }}>
        <KV label="Labor Contractor" value={labor?.name ?? labor?.NAME} />
        <KV label="Harvesting Rate" value={formatRate(plan?.harvesting_rate)} />
        <KV label="Forklift Contractor" value={forklift?.name ?? forklift?.NAME} />
        <KV label="Forklift Rate" value={formatRate(plan?.forklift_rate)} />
        <KV label="Hauler" value={hauler?.name ?? hauler?.NAME} />
        <KV label="Hauling Rate" value={formatRate(plan?.hauling_rate)} />
      </Box>
    </Paper>
  );
}
