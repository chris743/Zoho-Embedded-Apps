import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Chip, Divider, IconButton, Typography, Button,
  Tooltip, Card, CardMedia
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { buildCommodityMap, getCommodityIdxFromBlockOrPlan } from "../../utils/commodities";

function formatDate(ds) {
  if (!ds) return "-";
  try {
    const d = new Date(ds);
    if (isNaN(d.getTime())) return ds;
    const mm = String(d.getMonth() + 1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch { return ds; }
}

function formatRate(rate) {
  if (rate == null || rate === "") return "-";
  const num = Number(rate);
  if (isNaN(num)) return rate;
  return `$${num.toFixed(2)}`;
}

function formatCoordinate(coord) {
  if (coord == null || coord === "") return "-";
  const num = Number(coord);
  if (isNaN(num)) return coord;
  return num.toFixed(6);
}

function KV({ label, value, mono=false }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontFamily: mono ? "monospace" : "inherit" }}>
        {value ?? "-"}
      </Typography>
    </Box>
  );
}

/**
 * HarvestPlanViewDialog (read-only)
 * props:
 *  - open, onClose
 *  - plan: a HarvestPlan DTO/entity
 *  - blocks, contractors, commodities (arrays)
 *  - onEdit?: (plan) => void   // optional "Open in editor" button
 */
export default function ViewPlanDialog({
  open,
  onClose,
  plan,
  blocks = [],
  contractors = [],
  commodities = [],
  scoutReportsSvc,
  onEdit
}) {
  const [scoutReports, setScoutReports] = useState([]);
  const [scoutImagesLoading, setScoutImagesLoading] = useState(false);

  // Build lookups
  const blockByKey = useMemo(() => {
    const m = new Map();
    for (const b of blocks) {
      const src = b.source_database ?? b.sourceDatabase ?? "";
      const idx = b.GABLOCKIDX ?? b.gablockidx ?? b.id;
      if (src && idx != null) {
        m.set(`${src}:${idx}`, b);
      }
    }
    return m;
  }, [blocks]);

  const contractorById = useMemo(() => {
    const m = new Map();
    for (const c of contractors) {
      const id = c.id ?? c.ID ?? c.contractor_id;
      if (id != null) {
        m.set(Number(id), c);
      }
    }
    return m;
  }, [contractors]);

  const commodityByIdx = useMemo(() => {
    if (!Array.isArray(commodities)) return new Map();
    return buildCommodityMap(commodities, false);
  }, [commodities]);

  // Resolve associated entities
  const blockKey = useMemo(() => {
    if (!plan?.grower_block_source_database || plan?.grower_block_id == null) return null;
    return `${plan.grower_block_source_database}:${plan.grower_block_id}`;
  }, [plan]);
  
  const block = blockKey ? blockByKey.get(blockKey) : null;

  const labor = useMemo(() => {
    if (!plan?.contractor_id) return null;
    return contractorById.get(Number(plan.contractor_id)) || null;
  }, [plan?.contractor_id, contractorById]);

  const forklift = useMemo(() => {
    if (!plan?.forklift_contractor_id) return null;
    return contractorById.get(Number(plan.forklift_contractor_id)) || null;
  }, [plan?.forklift_contractor_id, contractorById]);

  const hauler = useMemo(() => {
    if (!plan?.hauler_id) return null;
    return contractorById.get(Number(plan.hauler_id)) || null;
  }, [plan?.hauler_id, contractorById]);

  const commodity_idx = useMemo(() => getCommodityIdxFromBlockOrPlan(block, plan), [block, plan]);
  const commodityName = useMemo(() => {
    if (!commodity_idx) return "";
    return commodityByIdx.get(String(commodity_idx)) || "";
  }, [commodity_idx, commodityByIdx]);
  const copyAll = useMemo(() => () => {
    try {
      const full = {
        plan,
        associated: {
          block,
          labor,
          forklift,
          hauler,
          commodityName,
          commodity_idx
        }
      };
      navigator.clipboard.writeText(JSON.stringify(full, null, 2));
    } catch (err) {
      console.warn("Failed to copy to clipboard:", err);
    }
  }, [plan, block, labor, forklift, hauler, commodityName, commodity_idx]);

  const title = useMemo(() => {
    if (!plan) return "View Harvest Plan";
    const blockName = block?.NAME ?? block?.name ?? `Block ${plan.grower_block_id}`;
    return `View Harvest Plan — ${formatDate(plan.date)} • ${blockName}`;
  }, [plan, block]);

  // Fetch scout reports when plan changes
  useEffect(() => {
    const fetchScoutReports = async () => {
      if (!plan || !scoutReportsSvc) return;
      
      // Try different block ID fields - the BlockNumber_Ref should match block.id, block.ID, or block number
      const blockId = block?.id;
      console.log(blockId)
      
      if (!blockId) {
        console.warn("No block ID found for scout report lookup", { block, plan });
        return;
      }
      
      setScoutImagesLoading(true);
      try {
        const { data } = await scoutReportsSvc.listWithBlock({ 
          blockNumber_Ref: blockId,
          take: 10,
          orderBy: "DateCreated desc" 
        });
        const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || []);
        setScoutReports(arr);
      } catch (err) {
        console.warn("Failed to fetch scout reports:", err);
        setScoutReports([]);
      } finally {
        setScoutImagesLoading(false);
      }
    };

    fetchScoutReports();
  }, [plan, scoutReportsSvc, block]);

   return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 7 }}>
        {title}
        <Box sx={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 1 }}>
          <Tooltip title="Copy record + associations (JSON)">
            <IconButton size="small" onClick={copyAll}><ContentCopyIcon fontSize="small" /></IconButton>
          </Tooltip>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Overview Section */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Plan Overview</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <KV label="Date" value={formatDate(plan?.date)} />
            <KV label="Deliver To" value={plan?.deliver_to} />
            <KV label="Packed By" value={plan?.packed_by} />
            <KV label="Notes" value={plan?.notes_general} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KV label="Planned Bins" value={plan?.planned_bins ?? "-"} />
            <KV label="Actual Bins" value={plan?.bins ?? "-"} />
            <KV label="Pool" value={plan?.pool_id ?? "-"} />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Commodity</Typography>
              <Box>
                {commodityName
                  ? <Chip size="small" color="primary" label={commodityName} />
                  : <Typography variant="body2">-</Typography>}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <KV label="Record Id" value={plan?.id} mono />
            <KV label="Block Key" value={`${plan?.grower_block_source_database}:${plan?.grower_block_id}`} mono />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Block Details Section */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Block Details</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <KV label="Name" value={block?.NAME ?? block?.name} />
            <KV label="Grower" value={block?.GrowerName ?? block?.growerName} />
            <KV label="District" value={block?.DISTRICT ?? block?.district} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KV label="Source DB" value={block?.source_database} />
            <KV label="GABLOCKIDX" value={block?.GABLOCKIDX ?? block?.gablockidx} />
            <KV label="Variety (IDX)" value={block?.VARIETYIDX ?? block?.varietyidx} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KV label="Latitude" value={formatCoordinate(block?.LATITUDE)} />
            <KV label="Longitude" value={formatCoordinate(block?.LONGITUDE)} />
            <KV label="Acres" value={block?.ACRES ?? "-"} />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Scout Images Section */}
        <ScoutImagesCarousel 
          scoutReports={scoutReports}
          loading={scoutImagesLoading}
        />
        
        {/* Scout Size Data Section */}
        <ScoutSizeChart 
          scoutReports={scoutReports}
          loading={scoutImagesLoading}
        />

        <Divider sx={{ mb: 3 }} />

        {/* Resources Section */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Resources</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <KV label="Labor Contractor" value={labor?.name ?? labor?.NAME} />
            <KV label="Harvesting Rate" value={formatRate(plan?.harvesting_rate)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KV label="Forklift Contractor" value={forklift?.name ?? forklift?.NAME} />
            <KV label="Forklift Rate" value={formatRate(plan?.forklift_rate)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KV label="Hauler" value={hauler?.name ?? hauler?.NAME} />
            <KV label="Hauling Rate" value={formatRate(plan?.hauling_rate)} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        {onEdit && plan ? (
          <Button variant="contained" onClick={()=>onEdit(plan)}>Open in editor</Button>
        ) : null}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// Scout Images Carousel Component
function ScoutImagesCarousel({ scoutReports, loading }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get the most recent scout report with images
  const latestReport = scoutReports.find(report => report.imageHtml);
  
  // Parse images from ImageHTML 
  const images = useMemo(() => {
    if (!latestReport?.imageHtml) return [];
    
    const imageHtml = latestReport.imageHtml;
    
    // Extract src attributes from img tags using a more robust regex
    const srcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images = [];
    let match;
    
    while ((match = srcRegex.exec(imageHtml)) !== null) {
      const src = match[1];
      if (src && src.trim()) {
        images.push(src.trim());
      }
    }
    
    return images;
  }, [latestReport]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Reset current image when images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  if (loading) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Scout Images</Typography>
        <Typography variant="body2" color="text.secondary">Loading scout images...</Typography>
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Scout Images</Typography>
        <Typography variant="body2" color="text.secondary">No scout images available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Scout Images {latestReport && `(${formatDate(latestReport.DateCreated)})`}
      </Typography>
      
      <Box sx={{ position: 'relative', maxWidth: 600, mx: 'auto' }}>
        <Card sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height={300}
            image={images[currentImageIndex]}
            alt={`Scout image ${currentImageIndex + 1}`}
            sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
            onError={(e) => {
              console.warn("Failed to load scout image:", images[currentImageIndex]);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex'; // Show error message
            }}
          />
          
          {/* Error fallback */}
          <Box
            sx={{
              display: 'none',
              height: 300,
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              color: 'text.secondary',
              flexDirection: 'column'
            }}
          >
            <Typography variant="body2">Image failed to load</Typography>
            <Typography variant="caption" sx={{ mt: 1, wordBreak: 'break-all', px: 2, textAlign: 'center' }}>
              {images[currentImageIndex]}
            </Typography>
          </Box>
          
          {images.length > 1 && (
            <>
              {/* Previous Button */}
              <IconButton
                onClick={prevImage}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <ArrowBackIosIcon />
              </IconButton>

              {/* Next Button */}
              <IconButton
                onClick={nextImage}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>

              {/* Image Counter */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                {currentImageIndex + 1} / {images.length}
              </Box>
            </>
          )}
        </Card>
      </Box>
    </Box>
  );
}

// Scout Size Chart Component
function ScoutSizeChart({ scoutReports, loading }) {
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
        
        console.log(`Parsing size${i}:`, { rawValue: valueStr, extractedLabel: sizeLabel });
        
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
        <Box sx={{ width: '100%', maxWidth: 600 }}>
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
                height: 8, 
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