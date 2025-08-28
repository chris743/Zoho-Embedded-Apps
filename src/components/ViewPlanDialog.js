import React, { useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Chip, Divider, IconButton, Typography, Button,
  Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { buildCommodityMap, getCommodityIdxFromBlockOrPlan } from "./utils/commodities";

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
  onEdit
}) {

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