import React, { useMemo } from "react";
import {
  Box, Typography, Card,
} from "@mui/material";
import formatDate from "./utils/dateutils";

// Scout Size Chart Component
export function ScoutSizeChart({ scoutReports, loading }) {
  // Get the most recent scout report with size data
  const latestReport = useMemo(() => {
    return scoutReports.find(report => 
      report.size1 !== null || report.size2 !== null || report.size3 !== null ||
      report.size4 !== null || report.size5 !== null || report.size6 !== null ||
      report.size7 !== null || report.size8 !== null || report.size9 !== null
    );
  }, [scoutReports]);

  // Extract size data
  const sizeData = useMemo(() => {
    if (!latestReport) return [];
    
    const sizes = [];
    for (let i = 1; i <= 9; i++) {
      const rawValue = latestReport[`size${i}`];
      if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
        // Parse value from "commodity size %of_total" format
        const valueStr = String(rawValue);
        
        // Extract the percentage number before the % sign
        const percentMatch = valueStr.match(/(\d+(?:\.\d+)?)%/);
        const numericValue = percentMatch ? parseFloat(percentMatch[1]) : 0;
        
        // Extract the size label from the string
        // Try multiple patterns to handle different formats
        let sizeLabel = `Size ${i}`; // fallback
        
        // Pattern 1: "Commodity SizeName XX.X%" - extract the size name
        let match = valueStr.match(/^[^\s]+\s+(.+?)\s+\d+(?:\.\d+)?%/);
        if (match) {
          sizeLabel = match[1].trim();
        } else {
          // Pattern 2: Just look for words before the percentage
          match = valueStr.match(/([A-Za-z\s]+)\s+\d+(?:\.\d+)?%/);
          if (match) {
            const words = match[1].trim().split(/\s+/);
            // Take the last word(s) as size, skip first word as commodity
            if (words.length > 1) {
              sizeLabel = words.slice(1).join(' ');
            }
          }
        }
        
        
        if (numericValue > 0) {
          sizes.push({
            label: sizeLabel,
            value: numericValue,
            rawValue: valueStr // Keep original for debugging
          });
        }
      }
    }
    return sizes;
  }, [latestReport]);

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...sizeData.map(item => item.value), 1);
  }, [sizeData]);

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Size Distribution</Typography>
        <Typography variant="body2" color="text.secondary">Loading size data...</Typography>
      </Box>
    );
  }

  if (sizeData.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Size Distribution</Typography>
        <Typography variant="body2" color="text.secondary">No size data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Size Distribution {latestReport && `(${formatDate(latestReport.DateCreated)})`}
      </Typography>
      
      <Card sx={{ p: 2 }}>
        <Box>
          {sizeData.map((item, index) => (
            <Box key={item.label} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  {item.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.value}%
                </Typography>
              </Box>
              
              <Box sx={{ 
                width: '100%', 
                height: 10, 
                bgcolor: '#e0e0e0', 
                borderRadius: 1,
                overflow: 'hidden' 
              }}>
                <Box sx={{
                  width: `${(item.value / maxValue) * 100}%`,
                  height: '100%',
                  bgcolor: getBarColor(index),
                  borderRadius: 1,
                  transition: 'width 0.3s ease-in-out'
                }} />
              </Box>
            </Box>
          ))}
        </Box>
        
        <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary">
            Total percentage: {sizeData.reduce((sum, item) => sum + item.value, 0).toFixed(1)}%
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}

// Generate colors for the bars
function getBarColor(index) {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];
  return colors[index % colors.length];
}