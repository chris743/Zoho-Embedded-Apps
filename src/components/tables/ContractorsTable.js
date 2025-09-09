import React, { useMemo, useState } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Box, Typography, Chip, Select, MenuItem, FormControl, InputLabel,
    IconButton, Tooltip, Button, Stack, Divider
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export default function ContractorsTable({ rows, loading, search, setSearch, onRefresh, onCreate, onEdit, onDelete }) {
    const [filters, setFilters] = useState({
        name: "",
        contact: "",
        services: ""
    });
    const [showFilters, setShowFilters] = useState(false);

    // Filter contractors based on search and filters
    const filteredData = useMemo(() => {
        return (rows || []).filter((contractor) => {
            const nameMatch = filters.name === "" || 
                (contractor.name || "").toLowerCase().includes(filters.name.toLowerCase());
            
            const contactMatch = filters.contact === "" || 
                (contractor.primary_contact_name || "").toLowerCase().includes(filters.contact.toLowerCase()) ||
                (contractor.primary_contact_phone || "").includes(filters.contact);
            
            let servicesMatch = true;
            if (filters.services) {
                switch (filters.services) {
                    case "trucking":
                        servicesMatch = contractor.provides_trucking;
                        break;
                    case "picking":
                        servicesMatch = contractor.provides_picking;
                        break;
                    case "forklift":
                        servicesMatch = contractor.provides_forklift;
                        break;
                }
            }
            
            const searchMatch = search === "" || 
                (contractor.name || "").toLowerCase().includes(search.toLowerCase()) ||
                (contractor.primary_contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
                (contractor.mailing_address || "").toLowerCase().includes(search.toLowerCase());
                
            return nameMatch && contactMatch && servicesMatch && searchMatch;
        }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [rows, filters, search]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearAllFilters = () => {
        setFilters({ name: "", contact: "", services: "" });
    };

    const getServiceChips = (contractor) => {
        const services = [];
        if (contractor.provides_trucking) services.push({ label: "Trucking", color: "success" });
        if (contractor.provides_picking) services.push({ label: "Picking", color: "primary" });
        if (contractor.provides_forklift) services.push({ label: "Forklift", color: "warning" });
        
        return services.map((service, index) => (
            <Chip
                key={index}
                label={service.label}
                size="small"
                color={service.color}
                variant="outlined"
                sx={{ 
                    fontSize: "0.7rem",
                    height: '20px',
                    mr: 0.5
                }}
            />
        ));
    };

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                <Typography variant="h6">
                    Contractors - {filteredData.length} Items
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onCreate}
                        sx={{ 
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        New Contractor
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                        sx={{ 
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Refresh
                    </Button>
                    <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    {showFilters && (
                        <Tooltip title="Clear All Filters">
                            <IconButton onClick={clearAllFilters}>
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ p: 2, pt: 0 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Search contractors, contacts, or addresses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ bgcolor: "background.paper" }}
                />
            </Box>

            {showFilters && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 2, backgroundColor: "#f5f5f5" }}>
                    <TextField
                        label="Company Name"
                        size="small"
                        value={filters.name}
                        onChange={(e) => handleFilterChange("name", e.target.value)}
                        sx={{ minWidth: 150 }}
                    />

                    <TextField
                        label="Contact Info"
                        size="small"
                        value={filters.contact}
                        onChange={(e) => handleFilterChange("contact", e.target.value)}
                        sx={{ minWidth: 150 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Services</InputLabel>
                        <Select
                            value={filters.services}
                            label="Services"
                            onChange={(e) => handleFilterChange("services", e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="trucking">Trucking</MenuItem>
                            <MenuItem value="picking">Picking</MenuItem>
                            <MenuItem value="forklift">Forklift</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}

            <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
                <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224, 224, 224, 0.5)' } }}>
                    <TableHead>
                        <TableRow sx={{ height: '36px' }}>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>ID</TableCell>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Company Name</TableCell>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Primary Contact</TableCell>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Phone Numbers</TableCell>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Address</TableCell>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Services</TableCell>
                            <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary">Loading contractors...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary">No contractors match the selected filters</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((contractor) => (
                                <TableRow 
                                    key={contractor.id} 
                                    hover 
                                    sx={{ 
                                        "&:hover": { cursor: "pointer" },
                                        height: '48px'
                                    }}
                                >
                                    <TableCell sx={{ py: 0.5, fontWeight: 500, color: 'text.secondary' }}>
                                        #{contractor.id}
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5, fontWeight: 600 }}>
                                        {contractor.name || "-"}
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                        {contractor.primary_contact_name || "-"}
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                        <Box>
                                            {contractor.primary_contact_phone && (
                                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                    Mobile: {contractor.primary_contact_phone}
                                                </Typography>
                                            )}
                                            {contractor.office_phone && (
                                                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                    Office: {contractor.office_phone}
                                                </Typography>
                                            )}
                                            {!contractor.primary_contact_phone && !contractor.office_phone && "-"}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5, maxWidth: 200 }}>
                                        <Typography variant="body2" sx={{ 
                                            fontSize: '0.8rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {contractor.mailing_address || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {getServiceChips(contractor)}
                                            {!contractor.provides_trucking && !contractor.provides_picking && !contractor.provides_forklift && (
                                                <Typography variant="caption" color="text.secondary">None</Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => onEdit(contractor)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => onDelete(contractor)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(224, 224, 224, 1)" }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredData.length} of {rows?.length || 0} contractors
                </Typography>
            </Box>
        </Paper>
    );
}