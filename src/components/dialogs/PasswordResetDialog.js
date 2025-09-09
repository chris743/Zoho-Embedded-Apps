import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    Stack,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    VpnKey as KeyIcon
} from '@mui/icons-material';
import { UsersApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

export function PasswordResetDialog({ open, onClose, userId, onSuccess }) {
    const { apiClient } = useAuth();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const usersApi = UsersApi(apiClient);

    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.newPassword.trim()) {
            errors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            errors.newPassword = 'Password must be at least 6 characters';
        }
        
        if (!formData.confirmPassword.trim()) {
            errors.confirmPassword = 'Please confirm the new password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await usersApi.resetPassword(userId, {
                newPassword: formData.newPassword
            });
            
            onSuccess('Password reset successfully');
            onClose();
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 
                               err?.response?.data?.title || 
                               err?.message || 
                               'Failed to reset password';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ newPassword: '', confirmPassword: '' });
            setError('');
            setFieldErrors({});
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
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    Reset Password
                </Typography>
            </DialogTitle>
            
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={3}>
                        {error && (
                            <Alert severity="error" onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}
                        
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2">
                                Enter a new password for this user. The user will need to use this password for their next login.
                            </Typography>
                        </Alert>
                        
                        <TextField
                            fullWidth
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={handleInputChange('newPassword')}
                            error={!!fieldErrors.newPassword}
                            helperText={fieldErrors.newPassword}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <KeyIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        
                        <TextField
                            fullWidth
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleInputChange('confirmPassword')}
                            error={!!fieldErrors.confirmPassword}
                            helperText={fieldErrors.confirmPassword}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <KeyIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
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
                        type="submit" 
                        variant="contained" 
                        color="warning"
                        disabled={loading}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 500,
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
