import React, { useMemo, useState } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Box, Typography, Chip, Select, MenuItem, FormControl, InputLabel,
    IconButton, Tooltip, Button, useMediaQuery, useTheme, Card, CardContent,
    Stack
} from "@mui/material";
import { useViewMode } from '../../contexts/ViewModeContext';
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { getCommodityColor, getContrastColor } from "../../utils/theme";
import { exportToPDF } from "./TableActions/Harvest2pdf";
import { formatDate } from "./tableutils/formatDate";
import { exportToCSV } from "./TableActions/Harvest2csv";
import { hexToRgba } from "./tableutils/colorHelpers";

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
    fieldRepresentatives = [],
    onRowClick,
    onViewClick,
    dateTitle
}) {
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();
    
    // Determine if we should use mobile layout
    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);
    
    const [filters, setFilters] = useState({
        commodity: "",
        grower: "",
        block: "",
        anyContractor: "",
        deliverTo: "",
        fieldRep: ""
    });
    const [showFilters, setShowFilters] = useState(false);

    // Index helpers for contractors and field representatives
    const contractorById = useMemo(() => {
        const m = new Map();
        for (const c of contractors || []) {
            const id = c.id ?? c.ID ?? c.contractor_id;
            if (id != null) m.set(Number(id), c);
        }
        return m;
    }, [contractors]);

    const fieldRepById = useMemo(() => {
        const m = new Map();
        for (const fr of fieldRepresentatives || []) {
            const id = fr.id;
            if (id != null) m.set(id, fr);
        }
        return m;
    }, [fieldRepresentatives]);

    // Enrich plans for display using new data structure
    const data = useMemo(() => {
        return (plans || []).map((p) => {
            const labor = contractorById.get(p.contractor_id ?? -1);
            const forklift = contractorById.get(p.forklift_contractor_id ?? -1);
            const hauler = contractorById.get(p.hauler_id ?? -1);
            const fieldRep = fieldRepById.get(p.field_representative_id);

            // Check if this is a placeholder grower
            const isPlaceholder = p.grower_block_source_database === "PLACEHOLDER" && p.grower_block_id === 999999;
            let grower_name = "";
            let block_name = "";
            let commodityName = "";

            if (isPlaceholder) {
                // Extract placeholder grower info from notes
                const placeholderMatch = p.notes_general?.match(/PLACEHOLDER GROWER: ([^|]+) \| COMMODITY: ([^\n]+)/);
                if (placeholderMatch) {
                    grower_name = placeholderMatch[1].trim();
                    commodityName = placeholderMatch[2].trim();
                    block_name = "Placeholder Block";
                } else {
                    grower_name = "Unknown Placeholder";
                    block_name = "Placeholder Block";
                    commodityName = p.commodity?.commodity || p.commodity?.invoiceCommodity || "";
                }
            } else {
                // Regular block
                grower_name = p.block?.growerName || "";
                block_name = p.block?.name || `${p.grower_block_id}`;
                commodityName = p.commodity?.commodity || p.commodity?.invoiceCommodity || "";
            }

            // Create a combined block identifier with ID at the front
            const block_id = p.block?.id || "";
            const block_display = block_id ? `${block_id} - ${block_name}` : block_name;

            return {
                ...p,
                commodityName,
                grower_name,
                block_name,
                block_id,
                block_display,
                laborContractorName: labor?.name ?? labor?.NAME ?? "",
                forkliftContractorName: forklift?.name ?? forklift?.NAME ?? "",
                truckingContractorName: hauler?.name ?? hauler?.NAME ?? "",
                fieldRepresentativeName: fieldRep?.fullName || fieldRep?.full_name || fieldRep?.username || "",
                laborContractorColor: labor?.color,
                forkliftContractorColor: forklift?.color,
                truckingContractorColor: hauler?.color,
                isPlaceholder
            };
        });
    }, [plans, contractorById, fieldRepById]);
    // Filter option sets
    const filterOptions = useMemo(() => {
        const o = {
            commodity: new Set(),
            grower: new Set(),
            anyContractor: new Set(),
            deliverTo: new Set(),
            fieldRep: new Set(),
        };
        for (const r of data) {
            if (r.commodityName) o.commodity.add(r.commodityName);
            if (r.grower_name) o.grower.add(r.grower_name);
            // Combine all contractors from all three columns
            if (r.laborContractorName) o.anyContractor.add(r.laborContractorName);
            if (r.forkliftContractorName) o.anyContractor.add(r.forkliftContractorName);
            if (r.truckingContractorName) o.anyContractor.add(r.truckingContractorName);
            if (r.deliver_to) o.deliverTo.add(r.deliver_to);
            if (r.fieldRepresentativeName) o.fieldRep.add(r.fieldRepresentativeName);
        }
        const sort = (s) => Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
        return {
            commodity: sort(o.commodity),
            grower: sort(o.grower),
            anyContractor: sort(o.anyContractor),
            deliverTo: sort(o.deliverTo),
            fieldRep: sort(o.fieldRep),
        };
    }, [data]);

    // Apply filters and group by commodity
    const { filteredData, groupedData } = useMemo(() => {
        const blkNeedle = filters.block.trim().toLowerCase();
        const filtered = data.filter((r) =>
            (filters.commodity === "" || r.commodityName === filters.commodity) &&
            (filters.grower === "" || r.grower_name === filters.grower) &&
            (filters.anyContractor === "" || 
                r.laborContractorName === filters.anyContractor ||
                r.forkliftContractorName === filters.anyContractor ||
                r.truckingContractorName === filters.anyContractor) &&
            (filters.deliverTo === "" || r.deliver_to === filters.deliverTo) &&
            (filters.fieldRep === "" || r.fieldRepresentativeName === filters.fieldRep) &&
            (blkNeedle === "" || (r.block_name || "").toLowerCase().includes(blkNeedle))
        );

        // Sort by commodity first, then by date
        const sorted = filtered.sort((a, b) => {
            const commodityCompare = (a.commodityName || "").localeCompare(b.commodityName || "");
            if (commodityCompare !== 0) return commodityCompare;
            return new Date(a.date) - new Date(b.date);
        });

        // Group by commodity and add totals
        const grouped = [];
        const commodityGroups = new Map();
        
        // Group the data
        for (const row of sorted) {
            const commodity = row.commodityName || "Unknown";
            if (!commodityGroups.has(commodity)) {
                commodityGroups.set(commodity, []);
            }
            commodityGroups.get(commodity).push(row);
        }

        // Create grouped array with totals
        for (const [commodity, rows] of commodityGroups) {
            // Add all rows for this commodity
            grouped.push(...rows);
            
            // Add total row
            const totalBins = rows.reduce((sum, row) => sum + (row.bins ?? row.planned_bins ?? 0), 0);
            grouped.push({
                id: `total-${commodity}`,
                isTotal: true,
                commodityName: commodity,
                totalBins,
                rowCount: rows.length
            });
        }

        return { filteredData: sorted, groupedData: grouped };
    }, [data, filters]);
    const handleFilterChange = (field, value) =>
        setFilters((prev) => ({ ...prev, [field]: value }));

    const clearAllFilters = () =>
        setFilters({ commodity: "", grower: "", block: "", anyContractor: "", deliverTo: "", fieldRep: "" });

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: isMobile ? "flex-start" : "center", 
                p: 2,
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 2 : 0
            }}>
                <Typography variant="h6">
                    {dateTitle ? `Harvest Plan - ${dateTitle}` : `Harvest Plans - ${filteredData.length} Items`}
                    {isMobile && (
                        <Chip 
                            label="📱 Mobile View" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 2, fontSize: '0.7rem' }}
                        />
                    )}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => exportToCSV(groupedData, "harvest-plans")}
                        sx={{ 
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => exportToPDF(groupedData, "harvest-plans")}
                        sx={{ 
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            color: '#d32f2f',
                            borderColor: '#d32f2f',
                            '&:hover': {
                                borderColor: '#b71c1c',
                                backgroundColor: 'rgba(211, 47, 47, 0.04)'
                            }
                        }}
                    >
                        Print PDF
                    </Button>
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
                        <InputLabel>Contractor (Any Role)</InputLabel>
                        <Select
                            value={filters.anyContractor}
                            label="Contractor (Any Role)"
                            onChange={(e) => handleFilterChange("anyContractor", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.anyContractor.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
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
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Field Rep</InputLabel>
                        <Select
                            value={filters.fieldRep}
                            label="Field Rep"
                            onChange={(e) => handleFilterChange("fieldRep", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.fieldRep.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {isMobile ? (
                // Mobile Card Layout
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 2
                }}>
                    {groupedData.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                No harvest plans match the selected filters
                            </Typography>
                        </Box>
                    ) : (
                        groupedData.map((row, index) => {
                            if (row.isTotal) {
                                // Total row - show as special card
                                return (
                                    <Card key={row.id} sx={{ 
                                        border: '2px solid',
                                        borderColor: 'primary.300',
                                        bgcolor: 'primary.50',
                                        borderRadius: 3,
                                        boxShadow: 2
                                    }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label={`${row.commodityName} Total (${row.rowCount} plans)`}
                                                    size="medium"
                                                    sx={{ 
                                                        fontSize: "0.8rem",
                                                        backgroundColor: getCommodityColor(row.commodityName),
                                                        color: getContrastColor(getCommodityColor(row.commodityName)),
                                                        fontWeight: 600,
                                                        height: '28px'
                                                    }}
                                                />
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {row.totalBins} Bins
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            } else {
                                // Regular data row - show as card
                                return (
                                    <Card key={row.id} sx={{ 
                                        cursor: 'pointer', 
                                        '&:hover': { boxShadow: 4 },
                                        border: '2px solid',
                                        borderColor: 'primary.200',
                                        borderRadius: 3,
                                        boxShadow: 2
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            {/* Header with Date and Actions */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                    {formatDate(row.date)}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => onRowClick?.(row)} color="primary">
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View">
                                                        <IconButton size="small" onClick={() => onViewClick?.(row)} color="secondary">
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            {/* Commodity Chip */}
                                            <Box sx={{ mb: 2 }}>
                                                <Chip
                                                    label={row.commodityName || "-"}
                                                    size="medium"
                                                    sx={{ 
                                                        fontSize: "0.8rem",
                                                        backgroundColor: getCommodityColor(row.commodityName),
                                                        color: getContrastColor(getCommodityColor(row.commodityName)),
                                                        fontWeight: 500,
                                                        height: '24px'
                                                    }}
                                                />
                                            </Box>

                                            {/* Details Grid */}
                                            <Stack spacing={1.5}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Grower:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.grower_name || "-"}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Block:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.block_display || "-"}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Bins:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                        {row.bins ?? row.planned_bins ?? 0}
                                                    </Typography>
                                                </Box>
                                                <Box 
                                                    sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        backgroundColor: row.laborContractorColor ? hexToRgba(row.laborContractorColor, 0.2) : 'transparent',
                                                        p: 0.5,
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Typography variant="body2" color="text.secondary">Labor:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.laborContractorName || "-"}</Typography>
                                                </Box>
                                                <Box 
                                                    sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        backgroundColor: row.forkliftContractorColor ? hexToRgba(row.forkliftContractorColor, 0.2) : 'transparent',
                                                        p: 0.5,
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Typography variant="body2" color="text.secondary">Forklift:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.forkliftContractorName || "-"}</Typography>
                                                </Box>
                                                <Box 
                                                    sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        backgroundColor: row.truckingContractorColor ? hexToRgba(row.truckingContractorColor, 0.2) : 'transparent',
                                                        p: 0.5,
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Typography variant="body2" color="text.secondary">Hauler:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.truckingContractorName || "-"}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Deliver To:</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.deliver_to || "-"}</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                );
                            }
                        })
                    )}
                </Box>
            ) : (
                // Desktop Table Layout
                <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
                    <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224, 224, 224, 0.5)' } }}>
                        <TableHead>
                            <TableRow sx={{ height: '36px' }}>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Date</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Commodity</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Grower</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Block</TableCell>
                                <TableCell align="right" sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Bins</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Labor</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Forklift</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Hauler</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Deliver To</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Field Rep</TableCell>
                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center">
                                        <Typography color="text.secondary">No harvest plans match the selected filters</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groupedData.map((row) => {
                                    if (row.isTotal) {
                                        // Total row
                                        return (
                                            <TableRow 
                                                key={row.id} 
                                                sx={{ 
                                                    height: '32px',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                    borderTop: '2px solid rgba(0, 0, 0, 0.1)'
                                                }}
                                            >
                                                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
                                                    <Chip
                                                        label={`${row.commodityName} Total (${row.rowCount} plans)`}
                                                        size="small"
                                                        sx={{ 
                                                            fontSize: "0.7rem",
                                                            backgroundColor: getCommodityColor(row.commodityName),
                                                            color: getContrastColor(getCommodityColor(row.commodityName)),
                                                            fontWeight: 600,
                                                            height: '22px'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell align="right" sx={{ py: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
                                                    {row.totalBins}
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                                <TableCell sx={{ py: 0.5 }}></TableCell>
                                            </TableRow>
                                        );
                                    } else {
                                        // Regular data row
                                        return (
                                            <TableRow 
                                                key={row.id} 
                                                hover 
                                                sx={{ 
                                                    "&:hover": { cursor: "pointer" },
                                                    height: '36px'
                                                }}
                                            >
                                                <TableCell sx={{ py: 0.5 }}>{formatDate(row.date)}</TableCell>
                                                <TableCell sx={{ py: 0.5 }}>
                                                    <Chip
                                                        label={row.commodityName || "-"}
                                                        size="small"
                                                        sx={{ 
                                                            fontSize: "0.7rem",
                                                            backgroundColor: getCommodityColor(row.commodityName),
                                                            color: getContrastColor(getCommodityColor(row.commodityName)),
                                                            fontWeight: 500,
                                                            height: '20px'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5 }}>{row.grower_name || "-"}</TableCell>
                                                <TableCell sx={{ py: 0.5 }}>{row.block_display || "-"}</TableCell>
                                                <TableCell align="right" sx={{ py: 0.5 }}>{row.bins ?? row.planned_bins ?? 0}</TableCell>
                                                <TableCell 
                                                    sx={{ 
                                                        py: 0.5,
                                                        backgroundColor: row.laborContractorColor ? hexToRgba(row.laborContractorColor, 0.2) : 'transparent'
                                                    }}
                                                >
                                                    {row.laborContractorName || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    sx={{ 
                                                        py: 0.5,
                                                        backgroundColor: row.forkliftContractorColor ? hexToRgba(row.forkliftContractorColor, 0.2) : 'transparent'
                                                    }}
                                                >
                                                    {row.forkliftContractorName || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    sx={{ 
                                                        py: 0.5,
                                                        backgroundColor: row.truckingContractorColor ? hexToRgba(row.truckingContractorColor, 0.2) : 'transparent'
                                                    }}
                                                >
                                                    {row.truckingContractorName || "-"}
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5 }}>{row.deliver_to || "-"}</TableCell>
                                                <TableCell sx={{ py: 0.5 }}>{row.fieldRepresentativeName || "-"}</TableCell>
                                                <TableCell sx={{ py: 0.5 }}>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" onClick={() => onRowClick?.(row)} color="primary">
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="View">
                                                            <IconButton size="small" onClick={() => onViewClick?.(row)} color="secondary">
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ p: 2, borderTop: "1px solid rgba(224, 224, 224, 1)" }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredData.length} of {data.length} harvest plans
                </Typography>
            </Box>
        </Paper>
    );
}