import React from "react";
import {
  Paper,
  Typography,
  Box
} from "@mui/material";
import { commonStyles } from "../../../utils/theme";
import { KV } from "../KV";
import formatDate from "../utils/dateutils";

/**
 * Plan overview section showing basic plan information
 */
export function PlanOverviewSection({ plan, poolName }) {
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
        Plan Overview
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 0, overflow: 'auto' }}>
        <KV label="Date" value={formatDate(plan?.date)} />
        <KV label="Delivery" value={plan?.deliver_to} />
        <KV label="Packed By" value={plan?.packed_by} />
        <KV label="Planned Bins" value={plan?.planned_bins ?? '-'} />
        <KV label="Actual Bins" value={plan?.bins ?? '-'} />
        <KV label="Pool" value={poolName ?? '-'} />
        <KV label="Notes" value={plan?.notes_general} />
      </Box>
    </Paper>
  );
}
