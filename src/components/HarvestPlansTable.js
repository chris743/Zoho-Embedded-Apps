import React, { useMemo, useState } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Box, Typography, Chip, Select, MenuItem, FormControl, InputLabel,
    IconButton, Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

// tiny date formatter
const formatDate = (iso) => {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    } catch { return iso; }
};

/**
 * HarvestPlansTable
 * props:
 *  - plans: array from /HarvestPlans
 *  - blocks: array from /Blocks (fields: source_database, GABLOCKIDX, NAME, GrowerName, CMTYIDX, VARIETYIDX)
 *  - contractors: array from /Contractors (fields: id, name)
 *  - commodities: array from /Commodities (fields: CMTYIDX or id, DESCR/name, source_database)
 */
export function HarvestPlansTable({
    plans = [],
    commodities = [],
    blocks = [],
    contractors = [],
    onRowClick,
    dateTitle
}) {
    // Map CMTYIDX -> commodity name (filtered to source_database=cobblestone)
    const commodityByIdx = useMemo(() => {
        const m = new Map();
        for (const c of (commodities || [])) {
            const src = (c.source_database ?? c.SOURCE_DATABASE ?? "").toString().toLowerCase();
            if (src && src !== "cobblestone") continue; // apply your source filter
            const idx = c.commodityIDx
            const name = c.commodity
            if (idx != null) m.set(String(idx), String(name));
        }
        return m;
    }, [commodities]);
    const [filters, setFilters] = useState({
        commodity: "",
        grower: "",
        block: "",
        contractor: "",
        forklift: "",
        hauler: "",
        deliverTo: ""
    });
    const [showFilters, setShowFilters] = useState(false);

    // Index helpers
    const blockByKey = useMemo(() => {
        const m = new Map();
        for (const b of blocks || []) {
            const src = b.source_database ?? b.sourceDatabase;
            const idx = b.GABLOCKIDX ?? b.gablockidx ?? b.id;
            if (src != null && idx != null) m.set(`${src}:${idx}`, b);
        }
        return m;
    }, [blocks]);

    const contractorById = useMemo(() => {
        const m = new Map();
        for (const c of contractors || []) {
            const id = c.id ?? c.ID ?? c.contractor_id;
            if (id != null) m.set(Number(id), c);
        }
        return m;
    }, [contractors]);

    // Enrich plans for display
    const data = useMemo(() => {
        return (plans || []).map((p) => {
            const k = `${p.grower_block_source_database}:${p.grower_block_id}`;
            const b = blockByKey.get(k);
            const labor = contractorById.get(p.contractor_id ?? -1);
            const forklift = contractorById.get(p.forklift_contractor_id ?? -1);
            const hauler = contractorById.get(p.hauler_id ?? -1);

            const commodity_idx = b?.CMTYIDX ?? b?.cmtyidx ?? b?.VARIETYIDX ?? b?.varietyidx ?? null;
            const commodityName = commodity_idx != null
                ? (commodityByIdx.get(String(commodity_idx)) ?? String(commodity_idx))
                : "";

            return {
                ...p,
                commodity_idx: commodity_idx,
                commodityName,
                grower_name: b?.GrowerName ?? b?.growerName ?? "",
                block_name: b?.NAME ?? b?.name ?? `${p.grower_block_id}`,
                laborContractorName: labor?.name ?? labor?.NAME ?? "",
                forkliftContractorName: forklift?.name ?? forklift?.NAME ?? "",
                truckingContractorName: hauler?.name ?? hauler?.NAME ?? "",
            };
        });
    }, [plans, blockByKey, contractorById, commodityByIdx]);
    // Filter option sets
    const filterOptions = useMemo(() => {
        const o = {
            commodity: new Set(),
            grower: new Set(),
            contractor: new Set(),
            forklift: new Set(),
            hauler: new Set(),
            deliverTo: new Set(),
        };
        for (const r of data) {
            if (r.commodityName) o.commodity.add(r.commodityName);
            if (r.grower_name) o.grower.add(r.grower_name);
            if (r.laborContractorName) o.contractor.add(r.laborContractorName);
            if (r.forkliftContractorName) o.forklift.add(r.forkliftContractorName);
            if (r.truckingContractorName) o.hauler.add(r.truckingContractorName);
            if (r.deliver_to) o.deliverTo.add(r.deliver_to);
        }
        const sort = (s) => Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
        return {
            commodity: sort(o.commodity),
            grower: sort(o.grower),
            contractor: sort(o.contractor),
            forklift: sort(o.forklift),
            hauler: sort(o.hauler),
            deliverTo: sort(o.deliverTo),
        };
    }, [data]);

    // Apply filters
    const filteredData = useMemo(() => {
        const blkNeedle = filters.block.trim().toLowerCase();
        return data.filter((r) =>
            (filters.commodity === "" || r.commodityName === filters.commodity) &&
            (filters.grower === "" || r.grower_name === filters.grower) &&
            (filters.contractor === "" || r.laborContractorName === filters.contractor) &&
            (filters.forklift === "" || r.forkliftContractorName === filters.forklift) &&
            (filters.hauler === "" || r.truckingContractorName === filters.hauler) &&
            (filters.deliverTo === "" || r.deliver_to === filters.deliverTo) &&
            (blkNeedle === "" || (r.block_name || "").toLowerCase().includes(blkNeedle))
        );
    }, [data, filters]);
    const handleFilterChange = (field, value) =>
        setFilters((prev) => ({ ...prev, [field]: value }));

    const clearAllFilters = () =>
        setFilters({ commodity: "", grower: "", block: "", contractor: "", forklift: "", hauler: "", deliverTo: "" });

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                <Typography variant="h6">
                    {dateTitle ? `Harvest Plan - ${dateTitle}` : `Harvest Plans - ${filteredData.length} Items`}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    {showFilters && (
                        <Tooltip title="Clear All Filters">
                            <IconButton onClick={clearAllFilters}><ClearIcon /></IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            {showFilters && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 2, backgroundColor: "#f5f5f5" }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Commodity</InputLabel>
                        <Select
                            value={filters.commodity}
                            label="Commodity"
                            onChange={(e) => handleFilterChange("commodity", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.commodity.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Grower</InputLabel>
                        <Select
                            value={filters.grower}
                            label="Grower"
                            onChange={(e) => handleFilterChange("grower", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.grower.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Block"
                        size="small"
                        value={filters.block}
                        onChange={(e) => handleFilterChange("block", e.target.value)}
                        sx={{ minWidth: 120 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Labor Contractor</InputLabel>
                        <Select
                            value={filters.contractor}
                            label="Labor Contractor"
                            onChange={(e) => handleFilterChange("contractor", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.contractor.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Forklift</InputLabel>
                        <Select
                            value={filters.forklift}
                            label="Forklift"
                            onChange={(e) => handleFilterChange("forklift", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.forklift.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Hauler</InputLabel>
                        <Select
                            value={filters.hauler}
                            label="Hauler"
                            onChange={(e) => handleFilterChange("hauler", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.hauler.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Deliver To</InputLabel>
                        <Select
                            value={filters.deliverTo}
                            label="Deliver To"
                            onChange={(e) => handleFilterChange("deliverTo", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.deliverTo.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            )}

            <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Commodity</TableCell>
                            <TableCell>Grower</TableCell>
                            <TableCell>Block</TableCell>
                            <TableCell align="right">Bins</TableCell>
                            <TableCell>Labor</TableCell>
                            <TableCell>Forklift</TableCell>
                            <TableCell>Hauler</TableCell>
                            <TableCell>Deliver To</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center">
                                    <Typography color="text.secondary">No harvest plans match the selected filters</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((row) => (
                                <TableRow key={row.id} hover sx={{ "&:hover": { cursor: "pointer" } }}>
                                    <TableCell>{formatDate(row.date)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.commodityName || "-"}
                                            size="small"
                                            color="primary"
                                            sx={{ fontSize: "0.75rem" }}
                                        />
                                    </TableCell>
                                    <TableCell>{row.grower_name || "-"}</TableCell>
                                    <TableCell>{row.block_name || "-"}</TableCell>
                                    <TableCell align="right">{row.bins ?? row.planned_bins ?? 0}</TableCell>
                                    <TableCell>{row.laborContractorName || "-"}</TableCell>
                                    <TableCell>{row.forkliftContractorName || "-"}</TableCell>
                                    <TableCell>{row.truckingContractorName || "-"}</TableCell>
                                    <TableCell>{row.deliver_to || "-"}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => onRowClick?.(row)} color="primary">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(224, 224, 224, 1)" }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredData.length} of {data.length} harvest plans
                </Typography>
            </Box>
        </Paper>
    );
}