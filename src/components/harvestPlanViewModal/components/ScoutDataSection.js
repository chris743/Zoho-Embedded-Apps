import React from "react";
import {
  Paper,
  Typography,
  Grid
} from "@mui/material";
import { commonStyles } from "../../../utils/theme";
import { ScoutImagesCarousel } from "../ImageCarousel";
import { ScoutSizeChart } from "../SizeBarChart";
import { QualityPieChart } from "../QualityPieChart";

/**
 * Scout data section showing images and size charts
 */
export function ScoutDataSection({ scoutReports, scoutImagesLoading }) {
  // Create a key based on the scout reports to force re-rendering
  const scoutReportsKey = scoutReports?.map(r => r.id).join(',') || 'empty';
  
  return (
    <Paper elevation={0} sx={{ ...commonStyles.section, m: 3, mb: 2 }} key={scoutReportsKey}>
      <Typography variant="h6" sx={commonStyles.sectionTitle}>
        Scout Data
      </Typography>

      <Grid container spacing={4} justifyContent="space-evenly">
        <Grid item xs={12} lg={3}>
          <ScoutImagesCarousel key={`images-${scoutReportsKey}`} scoutReports={scoutReports} loading={scoutImagesLoading} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <ScoutSizeChart key={`chart-${scoutReportsKey}`} scoutReports={scoutReports} loading={scoutImagesLoading} />
        </Grid>
        <Grid item xs={12} lg={3}>
          <QualityPieChart key={`pie-${scoutReportsKey}`} scoutReports={scoutReports} loading={scoutImagesLoading} />
        </Grid>
      </Grid>
    </Paper>
  );
}
