import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Alert,
    Box,
    Stack
} from '@mui/material';
import {
    Warning as WarningIcon
} from '@mui/icons-material';
import { UsersApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

export function DeleteUserDialog({ open, onClose, userId, userName, onSuccess }) {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const usersApi = UsersApi(apiClient);

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        
        try {
            await usersApi.remove(userId);
            onSuccess(`User "${userName}" deleted successfully`);
            onClose();
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 
                               err?.response?.data?.title || 
                               err?.message || 
                               'Failed to delete user';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError('');
            onClose();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        Delete User
                    </Typography>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2}>
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Are you sure you want to delete the user "{userName}"?
                        </Typography>
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary">
                        This action cannot be undone. The user will be permanently removed from the system and will no longer be able to access the application.
                    </Typography>
                    
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: 'error.light', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'error.main'
                    }}>
                        <Typography variant="body2" color="error.contrastText" sx={{ fontWeight: 500 }}>
                            ⚠️ Warning: This action is irreversible!
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={handleClose} 
                    disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleDelete}
                    variant="contained" 
                    color="error"
                    disabled={loading}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 500,
                        borderRadius: 2,
                        px: 3
                    }}
                >
                    {loading ? 'Deleting...' : 'Delete User'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
