import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Chip, Divider, IconButton, Typography, Button,
  Tooltip, Card, CardMedia,
  Stack
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { buildCommodityMap, getCommodityIdxFromBlockOrPlan } from "../utils/commodities";
import { buildPoolMap, getPoolIdxFromPlan } from "../utils/pools";
import formatDate from "./utils/dateutils";
import { formatRate, formatCoordinate } from "./utils/datautils";
import { ScoutImagesCarousel } from "./ImageCarousel";
import { ScoutSizeChart } from "./SizeBarChart";


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

export default function ViewPlanDialog({
  open,
  onClose,
  plan,
  blocks = [],
  contractors = [],
  commodities = [],
  pools = [],
  scoutReportsSvc,
  onEdit
}) {
  const [scoutReports, setScoutReports] = useState([]);
  const [scoutImagesLoading, setScoutImagesLoading] = useState(false);
  console.log(plan)

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

  const poolByIdx = useMemo(() => {
    if (!Array.isArray(pools)) return new Map();
    return buildPoolMap(pools, false);
  }, [pools])

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

  const pool_idx = useMemo(() => getPoolIdxFromPlan(plan),[plan])
  const poolName = useMemo(() => {
    if (!pool_idx) return "";
    return poolByIdx.get(String(pool_idx)) || null;
  }, [pool_idx, poolByIdx]);

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
            <KV label="Pool" value={poolName ?? "-"} />
          </Grid>
            <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
                <KV label="Name" value={block?.NAME ?? block?.name} />
                <KV label="Grower" value={block?.GrowerName ?? block?.growerName} />
                <KV label="District" value={block?.DISTRICT ?? block?.district} />
            </Grid>
            <Grid item xs={12} md={4}>
                <KV label="GABLOCKIDX" value={block?.id} />
                    <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Commodity</Typography>
                    <Box>
                        {commodityName
                        ? <Chip size="small" color="primary" label={commodityName} />
                        : <Typography variant="body2">-</Typography>}
                    </Box>
                    </Box>
                <KV label="Variety (IDX)" value={block?.VARIETYIDX ?? block?.varietyidx} />
            </Grid>
            <Grid item xs={12} md={4}>
                <KV label="Latitude" value={formatCoordinate(block?.LATITUDE)} />
                <KV label="Longitude" value={formatCoordinate(block?.LONGITUDE)} />
                <KV label="Acres" value={block?.ACRES ?? "-"} />
            </Grid>
        </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Block Details Section */}


        <Divider sx={{ mb: 3, mt: 3 }} />
        <Stack direction="row" spacing={5} >
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
        </Stack>

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


