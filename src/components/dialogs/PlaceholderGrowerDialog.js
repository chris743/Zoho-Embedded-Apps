import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Stack,
  FormControl,
  FormLabel,
  Chip,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { PlaceholderGrowersApi } from '../../api/placeholderGrowers';
import { CommoditiesApi } from '../../api/commodities';
import { getCommodityColor, getContrastColor } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useZohoAuth } from '../../utils/zohoAuth';
import { makeApi } from '../../api/client';

export function PlaceholderGrowerDialog({ open, onClose, placeholderGrower = null, onSave }) {
  const [formData, setFormData] = useState({
    grower_name: '',
    commodity_name: '',
    notes: '',
    is_active: true
  });
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commodityOptions, setCommodityOptions] = useState([]);

  const isEdit = Boolean(placeholderGrower?.id);

  // API setup - following exact same pattern as HarvestPlannerPage
  const [apiBase, setApiBase] = useState(() => localStorage.getItem("apiBase") || "http://localhost:5048/api/v1");
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
  const commoditiesSvc = useMemo(() => CommoditiesApi(api), [api]);

  useEffect(() => {
    if (open && isAuthenticated && !authLoading) {
      loadCommodities();
      if (placeholderGrower) {
        setFormData({
          grower_name: placeholderGrower.grower_name || '',
          commodity_name: placeholderGrower.commodity_name || '',
          notes: placeholderGrower.notes || '',
          is_active: placeholderGrower.is_active ?? true
        });
      } else {
        setFormData({
          grower_name: '',
          commodity_name: '',
          notes: '',
          is_active: true
        });
      }
      setError('');
    }
  }, [open, placeholderGrower, isAuthenticated, authLoading]);

  const loadCommodities = async () => {
    if (!isAuthenticated || authLoading) {
      console.log('🔍 PlaceholderGrowerDialog: Skipping commodities API call - not authenticated or still loading');
      return;
    }
    
    try {
      console.log('🔍 PlaceholderGrowerDialog: Making API call to load commodities...');
      const data = await commoditiesSvc.list();
      console.log('🔍 Commodities API response:', data);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('🔍 Commodities data is not an array:', data);
        setError('Invalid commodities data format received from server');
        return;
      }
      
      setCommodities(data);
      
      // Extract unique commodity names
      const uniqueCommodities = new Set();
      data.forEach(c => {
        const name = c.commodity || c.Commodity || c.DESCR || c.descr;
        if (name) uniqueCommodities.add(name);
      });
      setCommodityOptions(Array.from(uniqueCommodities).sort());
      console.log('🔍 PlaceholderGrowerDialog: Successfully loaded commodities:', uniqueCommodities.size, 'unique commodities');
    } catch (err) {
      console.error('🔍 PlaceholderGrowerDialog: Failed to load commodities:', err);
      console.error('🔍 Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers
      });
      setError(`Failed to load commodities: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.grower_name.trim()) {
      setError('Grower name is required');
      return;
    }
    if (!formData.commodity_name) {
      setError('Commodity is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        grower_name: formData.grower_name.trim(),
        commodity_name: formData.commodity_name,
        notes: formData.notes?.trim() || null,
        is_active: formData.is_active
      };

      let result;
      if (isEdit) {
        result = await placeholderGrowersSvc.update(placeholderGrower.id, data);
      } else {
        result = await placeholderGrowersSvc.create(data);
      }

      onSave(result);
      onClose();
    } catch (err) {
      console.error('Failed to save placeholder grower:', err);
      setError(err.response?.data?.message || 'Failed to save placeholder grower');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        grower_name: '',
        commodity_name: '',
        notes: '',
        is_active: true
      });
      setError('');
      onClose();
    }
  };

  if (authLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Placeholder Grower' : 'Add New Placeholder Grower'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>Authenticating...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Placeholder Grower' : 'Add New Placeholder Grower'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Please log in to create placeholder growers.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Placeholder Grower' : 'Add New Placeholder Grower'}
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Grower Name"
            value={formData.grower_name}
            onChange={(e) => handleInputChange('grower_name', e.target.value)}
            required
            placeholder="e.g., TBD Grower, Future Assignment"
            disabled={loading}
          />

          <Autocomplete
            options={commodityOptions}
            value={formData.commodity_name}
            onChange={(event, newValue) => handleInputChange('commodity_name', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Commodity"
                placeholder="Select Commodity"
                required
                disabled={loading}
              />
            )}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            multiline
            rows={3}
            placeholder="Additional notes about this placeholder grower..."
            disabled={loading}
          />

          {(formData.grower_name || formData.commodity_name) && (
            <Box>
              <FormLabel sx={{ mb: 1, display: 'block' }}>Preview:</FormLabel>
              <Chip
                label={`${formData.grower_name || 'N/A'} | ${formData.commodity_name || 'N/A'}`}
                sx={{
                  bgcolor: getCommodityColor(formData.commodity_name),
                  color: getContrastColor(getCommodityColor(formData.commodity_name)),
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  height: 'auto',
                  '& .MuiChip-label': {
                    whiteSpace: 'normal',
                    py: 1
                  }
                }}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.grower_name.trim() || !formData.commodity_name}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
