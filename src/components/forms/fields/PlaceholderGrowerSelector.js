import React, { useMemo, useState, useEffect } from "react";
import { 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Box, 
    Typography,
    Chip,
    Button,
    Stack,
    Alert,
    CircularProgress
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Add as AddIcon } from "@mui/icons-material";
import { PlaceholderGrowersApi } from "../../../api/placeholderGrowers";
import { PlaceholderGrowerDialog } from "../../dialogs/PlaceholderGrowerDialog";
import { getCommodityColor, getContrastColor } from "../../../utils/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useZohoAuth } from "../../../utils/zohoAuth";
import { makeApi } from "../../../api/client";

/**
 * PlaceholderGrowerSelector
 * Allows selection of a placeholder grower from the database when specific block is unknown
 * props:
 *  - value: { id: string, grower_name: string, commodity_name: string } | null
 *  - onChange: (next: { id: string, grower_name: string, commodity_name: string } | null) => void
 */
export function PlaceholderGrowerSelector({ value, onChange }) {
    const [placeholderGrowers, setPlaceholderGrowers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    // API setup - following exact same pattern as HarvestPlannerPage
    const [apiBase, setApiBase] = useState(() => localStorage.getItem("apiBase") || "https://api.cobblestonecloud.com/api/v1");
    const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
    
    // Get authentication state
    const { isAuthenticated: userAuth, loading: userLoading, token: userToken } = useAuth();
    const { isAuthenticated: zohoAuth, loading: zohoLoading, token: zohoToken } = useZohoAuth();
    
    // Determine which token to use
    const authToken = zohoToken || userToken || jwt;
    const isAuthenticated = zohoAuth || userAuth;
    const authLoading = zohoLoading || userLoading;
    
    const api = useMemo(() => makeApi(apiBase, authToken), [apiBase, authToken]);
    const placeholderGrowersSvc = useMemo(() => PlaceholderGrowersApi(api), [api]);

    // Load placeholder growers from database only when autocomplete is opened
    const handleAutocompleteOpen = () => {
        if (isAuthenticated && !authLoading && placeholderGrowers.length === 0 && !loading) {
            loadPlaceholderGrowers();
        }
    };

    const loadPlaceholderGrowers = async () => {
        if (!isAuthenticated || authLoading) {
            console.log('🔍 PlaceholderGrowerSelector: Skipping API call - not authenticated or still loading');
            return;
        }
        
        try {
            setLoading(true);
            console.log('🔍 PlaceholderGrowerSelector: Making API call to load placeholder growers...');
            const data = await placeholderGrowersSvc.getAll();
            // Filter to only active growers on the frontend
            const activeGrowers = data.filter(g => g.is_active);
            setPlaceholderGrowers(activeGrowers);
            setError('');
            console.log('🔍 PlaceholderGrowerSelector: Successfully loaded placeholder growers:', data);
        } catch (err) {
            console.error('🔍 PlaceholderGrowerSelector: Failed to load placeholder growers:', err);
            console.error('🔍 Error details:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                url: err.config?.url,
                method: err.config?.method,
                headers: err.config?.headers
            });
            setError(`Failed to load placeholder growers: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGrowerChange = (selectedGrower) => {
        if (selectedGrower) {
            onChange?.({
                id: selectedGrower.id,
                grower_name: selectedGrower.grower_name,
                commodity_name: selectedGrower.commodity_name
            });
        } else {
            onChange?.(null);
        }
    };

    const handleSave = (savedGrower) => {
        // Refresh the list
        loadPlaceholderGrowers();
        
        // If this was the grower we just created, select it
        if (savedGrower && !value) {
            handleGrowerChange(savedGrower);
        }
    };

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Placeholder Grower & Commodity (when block unknown)
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            <Stack spacing={2}>
                <Autocomplete
                    options={placeholderGrowers}
                    value={value ? placeholderGrowers.find(g => g.id === value.id) : null}
                    onChange={(_, newValue) => handleGrowerChange(newValue)}
                    onOpen={handleAutocompleteOpen}
                    getOptionLabel={(option) => `${option.grower_name} - ${option.commodity_name}`}
                    loading={loading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Placeholder Grower"
                            placeholder="Choose from existing placeholder growers"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                <Typography variant="body2">{option.grower_name}</Typography>
                                <Chip 
                                    label={option.commodity_name}
                                    size="small"
                                    sx={{ 
                                        bgcolor: getCommodityColor(option.commodity_name),
                                        color: getContrastColor(getCommodityColor(option.commodity_name)),
                                        fontSize: '0.7rem',
                                        height: 20
                                    }}
                                />
                            </Stack>
                        </Box>
                    )}
                />

                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                >
                    Create New Placeholder Grower
                </Button>
            </Stack>


            <PlaceholderGrowerDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                placeholderGrower={null}
                onSave={handleSave}
            />
        </Box>
    );
}
