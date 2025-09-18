import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { PlaceholderGrowersApi } from '../../api/placeholderGrowers';
import { PlaceholderGrowerDialog } from '../dialogs/PlaceholderGrowerDialog';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import { getCommodityColor, getContrastColor } from '../../utils/theme';
import { useViewMode } from '../../contexts/ViewModeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useZohoAuth } from '../../utils/zohoAuth';
import { makeApi } from '../../api/client';

export function PlaceholderGrowersTable() {
  const theme = useTheme();
  const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { viewMode } = useViewMode();
  const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);

  const [placeholderGrowers, setPlaceholderGrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrower, setEditingGrower] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  // API setup - following exact same pattern as HarvestPlannerPage
  const [apiBase, setApiBase] = useState(() => {
    const stored = localStorage.getItem("apiBase");
    const defaultUrl = "https://api.cobblestonecloud.com/api/v1";
    
    // Auto-fix: If stored URL contains localhost, clear it and use the correct URL
    if (stored && (stored.includes('localhost') || stored.includes('5048'))) {
      console.log('🔧 Auto-fixing localhost API URL to production URL');
      localStorage.removeItem("apiBase");
      return defaultUrl;
    }
    
    return stored || defaultUrl;
  });
  const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
  
  // Get authentication state
  const { isAuthenticated: userAuth, loading: userLoading, token: userToken } = useAuth();
  const { isAuthenticated: zohoAuth, loading: zohoLoading, token: zohoToken } = useZohoAuth();
  
  // Determine which token to use
  const authToken = zohoToken || userToken || jwt;
  const isAuthenticated = zohoAuth || userAuth;
  const authLoading = zohoLoading || userLoading;
  
  // Debug token information
  console.log('🔍 PlaceholderGrowersTable Token Debug Info:', {
    zohoToken: zohoToken ? `${zohoToken.substring(0, 20)}...` : 'null',
    userToken: userToken ? `${userToken.substring(0, 20)}...` : 'null',
    jwt: jwt ? `${jwt.substring(0, 20)}...` : 'null',
    authToken: authToken ? `${authToken.substring(0, 20)}...` : 'null',
    apiBase,
    zohoAuth,
    userAuth,
    isAuthenticated,
    authLoading
  });
  
  const api = useMemo(() => makeApi(apiBase, authToken), [apiBase, authToken]);
  const placeholderGrowersSvc = useMemo(() => PlaceholderGrowersApi(api), [api]);

  const loadPlaceholderGrowers = async () => {
    if (!isAuthenticated || authLoading) {
      console.log('🔍 Skipping API call - not authenticated or still loading');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Making API call to load placeholder growers...');
      const data = await placeholderGrowersSvc.getAll();
      setPlaceholderGrowers(data);
      setError('');
      console.log('🔍 Successfully loaded placeholder growers:', data);
    } catch (err) {
      console.error('🔍 Failed to load placeholder growers:', err);
      setError('Failed to load placeholder growers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadPlaceholderGrowers();
    }
  }, [placeholderGrowersSvc, isAuthenticated, authLoading]);

  const handleAdd = () => {
    setEditingGrower(null);
    setDialogOpen(true);
  };

  const handleEdit = (grower) => {
    setEditingGrower(grower);
    setDialogOpen(true);
  };

  const handleSave = (savedGrower) => {
    if (editingGrower) {
      // Update existing
      setPlaceholderGrowers(prev => 
        prev.map(g => g.id === savedGrower.id ? savedGrower : g)
      );
    } else {
      // Add new
      setPlaceholderGrowers(prev => [savedGrower, ...prev]);
    }
  };

  const handleDelete = (grower) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Placeholder Grower',
      message: `Are you sure you want to delete "${grower.grower_name}"? This will set it as inactive but preserve the data.`,
      onConfirm: async () => {
        try {
          await placeholderGrowersSvc.delete(grower.id);
          setPlaceholderGrowers(prev => 
            prev.map(g => g.id === grower.id ? { ...g, is_active: false } : g)
          );
        } catch (err) {
          console.error('Failed to delete placeholder grower:', err);
          setError('Failed to delete placeholder grower');
        }
      }
    });
  };

  const handleHardDelete = (grower) => {
    setConfirmDialog({
      open: true,
      title: 'Permanently Delete Placeholder Grower',
      message: `Are you sure you want to permanently delete "${grower.grower_name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await placeholderGrowersSvc.hardDelete(grower.id);
          setPlaceholderGrowers(prev => prev.filter(g => g.id !== grower.id));
        } catch (err) {
          console.error('Failed to permanently delete placeholder grower:', err);
          setError('Failed to permanently delete placeholder grower');
        }
      }
    });
  };

  const handleRestore = async (grower) => {
    try {
      const restored = await placeholderGrowersSvc.restore(grower.id);
      setPlaceholderGrowers(prev => 
        prev.map(g => g.id === grower.id ? restored : g)
      );
    } catch (err) {
      console.error('Failed to restore placeholder grower:', err);
      setError('Failed to restore placeholder grower');
    }
  };

  const { activeGrowers, inactiveGrowers } = useMemo(() => {
    const active = placeholderGrowers.filter(g => g.is_active);
    const inactive = placeholderGrowers.filter(g => !g.is_active);
    return { activeGrowers: active, inactiveGrowers: inactive };
  }, [placeholderGrowers]);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>Authenticating...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Alert severity="warning">
          Please log in to access placeholder growers.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>Loading placeholder growers...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Placeholder Growers
          {isMobile && <Chip label="📱 Mobile View" size="small" sx={{ ml: 1 }} />}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Placeholder Grower
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        // Mobile Card Layout
        <Stack spacing={2}>
          {activeGrowers.map((grower) => (
            <PlaceholderGrowerCard
              key={grower.id}
              grower={grower}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onHardDelete={handleHardDelete}
            />
          ))}
          
          {inactiveGrowers.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'text.secondary' }}>
                Inactive Placeholder Growers
              </Typography>
              <Stack spacing={2}>
                {inactiveGrowers.map((grower) => (
                  <PlaceholderGrowerCard
                    key={grower.id}
                    grower={grower}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onHardDelete={handleHardDelete}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      ) : (
        // Desktop Table Layout
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Grower Name</TableCell>
                <TableCell>Commodity</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeGrowers.map((grower) => (
                <TableRow key={grower.id}>
                  <TableCell>{grower.grower_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={grower.commodity_name}
                      size="small"
                      sx={{
                        bgcolor: getCommodityColor(grower.commodity_name),
                        color: getContrastColor(getCommodityColor(grower.commodity_name))
                      }}
                    />
                  </TableCell>
                  <TableCell>{grower.notes || '-'}</TableCell>
                  <TableCell>
                    <Chip label="Active" color="success" size="small" />
                  </TableCell>
                  <TableCell>{new Date(grower.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <PlaceholderGrowerActions
                      grower={grower}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                      onHardDelete={handleHardDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
              
              {inactiveGrowers.map((grower) => (
                <TableRow key={grower.id} sx={{ opacity: 0.6 }}>
                  <TableCell>{grower.grower_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={grower.commodity_name}
                      size="small"
                      sx={{
                        bgcolor: getCommodityColor(grower.commodity_name),
                        color: getContrastColor(getCommodityColor(grower.commodity_name))
                      }}
                    />
                  </TableCell>
                  <TableCell>{grower.notes || '-'}</TableCell>
                  <TableCell>
                    <Chip label="Inactive" color="default" size="small" />
                  </TableCell>
                  <TableCell>{new Date(grower.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <PlaceholderGrowerActions
                      grower={grower}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                      onHardDelete={handleHardDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {placeholderGrowers.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No placeholder growers found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create your first placeholder grower to get started
          </Typography>
        </Box>
      )}

      <PlaceholderGrowerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        placeholderGrower={editingGrower}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
      />
    </Box>
  );
}

// Mobile Card Component
function PlaceholderGrowerCard({ grower, onEdit, onDelete, onRestore, onHardDelete }) {
  return (
    <Paper
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 1
      }}
    >
      <Stack spacing={1}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6">{grower.grower_name}</Typography>
          <PlaceholderGrowerActions
            grower={grower}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            onHardDelete={onHardDelete}
          />
        </Box>
        
        <Chip
          label={grower.commodity_name}
          size="small"
          sx={{
            bgcolor: getCommodityColor(grower.commodity_name),
            color: getContrastColor(getCommodityColor(grower.commodity_name)),
            alignSelf: 'flex-start'
          }}
        />
        
        {grower.notes && (
          <Typography variant="body2" color="text.secondary">
            {grower.notes}
          </Typography>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={grower.is_active ? "Active" : "Inactive"}
            color={grower.is_active ? "success" : "default"}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(grower.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// Actions Menu Component
function PlaceholderGrowerActions({ grower, onEdit, onDelete, onRestore, onHardDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => { onEdit(grower); handleClose(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        {grower.is_active ? (
          <MenuItem onClick={() => { onDelete(grower); handleClose(); }}>
            <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Deactivate</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { onRestore(grower); handleClose(); }}>
            <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Restore</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => { onHardDelete(grower); handleClose(); }}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Permanently Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
