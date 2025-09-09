import React, { useMemo } from "react";
import {
  Box, Typography, Card
} from "@mui/material";
import { formatDate } from "../../utils/dateUtils";

/**
 * Quality pie chart component showing Est Fancy % and Est Choice %
 */
export function QualityPieChart({ scoutReports, loading }) {
  // Get the most recent scout report with quality data
  const latestReport = useMemo(() => {
    return scoutReports.find(report => 
      report.estFancyPct !== null || report.estChoicePct !== null ||
      report.estFancy !== null || report.estChoice !== null
    );
  }, [scoutReports]);

  // Extract quality data
  const qualityData = useMemo(() => {
    if (!latestReport) return [];

    const data = [];
    
    // Try different field name variations
    const fancyValue = latestReport.estFancyPct ?? latestReport.estFancy ?? latestReport['Est Fancy %'];
    const choiceValue = latestReport.estChoicePct ?? latestReport.estChoice ?? latestReport['Est Choice %'];
    
    // Parse fancy percentage
    if (fancyValue !== null && fancyValue !== undefined && fancyValue !== '') {
      const fancyStr = String(fancyValue);
      const fancyMatch = fancyStr.match(/(\d+(?:\.\d+)?)/);
      const fancyPercent = fancyMatch ? parseFloat(fancyMatch[1]) : 0;
      
      if (fancyPercent > 0) {
        data.push({
          label: 'Fancy',
          value: fancyPercent,
          color: '#2E7D32' // Green
        });
      }
    }
    
    // Parse choice percentage
    if (choiceValue !== null && choiceValue !== undefined && choiceValue !== '') {
      const choiceStr = String(choiceValue);
      const choiceMatch = choiceStr.match(/(\d+(?:\.\d+)?)/);
      const choicePercent = choiceMatch ? parseFloat(choiceMatch[1]) : 0;
      
      if (choicePercent > 0) {
        data.push({
          label: 'Choice',
          value: choicePercent,
          color: '#1976D2' // Blue
        });
      }
    }
    
    // Calculate remaining percentage for "Other"
    const totalPercent = data.reduce((sum, item) => sum + item.value, 0);
    if (totalPercent < 100) {
      data.push({
        label: 'Other',
        value: 100 - totalPercent,
        color: '#757575' // Gray
      });
    }
    
    return data;
  }, [latestReport]);

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Quality Distribution</Typography>
        <Typography variant="body2" color="text.secondary">Loading quality data...</Typography>
      </Box>
    );
  }

  if (qualityData.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Quality Distribution</Typography>
        <Typography variant="body2" color="text.secondary">No quality data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Quality Distribution {latestReport && `(${formatDate(latestReport.DateCreated)})`}
      </Typography>
      
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Pie Chart SVG */}
          <Box sx={{ position: 'relative', width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {(() => {
                let currentAngle = 0;
                const radius = 80;
                const centerX = 100;
                const centerY = 100;
                
                return qualityData.map((item, index) => {
                  const angle = (item.value / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle += angle;
                  
                  // Convert angles to radians
                  const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                  const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                  
                  // Calculate arc path
                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                });
              })()}
            </svg>
          </Box>
          
          {/* Legend */}
          <Box sx={{ ml: 3, minWidth: 120 }}>
            {qualityData.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: item.color,
                    borderRadius: '50%',
                    mr: 1,
                    flexShrink: 0
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {item.label}: {item.value.toFixed(1)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
