import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    Stack,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person as PersonIcon,
    Email as EmailIcon,
    VpnKey as KeyIcon
} from '@mui/icons-material';
import { UsersApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

const USER_ROLES = [
    { value: 'admin', label: 'Administrator', color: 'error' },
    { value: 'manager', label: 'Manager', color: 'warning' },
    { value: 'user', label: 'User', color: 'primary' },
    { value: 'readonly', label: 'Read Only', color: 'default' },
    { value: 'fieldrep', label: 'Field Representative', color: 'success' }
];

export function UserDialog({ open, onClose, user, isEdit, onSuccess }) {
    const { apiClient } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        role: 'user',
        isActive: true,
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const usersApi = UsersApi(apiClient);

    // Reset form when dialog opens/closes or user changes
    useEffect(() => {
        if (open) {
            if (isEdit && user) {
                setFormData({
                    username: user.username || '',
                    email: user.email || '',
                    fullName: user.fullName || '',
                    role: user.role || 'user',
                    isActive: user.isActive !== undefined ? user.isActive : true,
                    password: '',
                    confirmPassword: ''
                });
            } else {
                setFormData({
                    username: '',
                    email: '',
                    fullName: '',
                    role: 'user',
                    isActive: true,
                    password: '',
                    confirmPassword: ''
                });
            }
            setError('');
            setFieldErrors({});
        }
    }, [open, isEdit, user]);

    const handleInputChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!isEdit && !formData.password.trim()) {
            errors.password = 'Password is required for new users';
        } else if (formData.password && formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        if (!isEdit && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (isEdit && formData.password && formData.password !== formData.confirmPassword) {
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
            const userData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                fullName: formData.fullName.trim(),
                role: formData.role,
                isActive: formData.isActive
            };
            
            // Only include password if it's provided (for new users or password changes)
            if (formData.password.trim()) {
                userData.password = formData.password;
            }
            
            if (isEdit) {
                await usersApi.update(user.id, userData);
                onSuccess('User updated successfully');
            } else {
                await usersApi.create(userData);
                onSuccess('User created successfully');
            }
            
            onClose();
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 
                               err?.response?.data?.title || 
                               err?.message || 
                               `Failed to ${isEdit ? 'update' : 'create'} user`;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
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
                    {isEdit ? 'Edit User' : 'Create New User'}
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
                        
                        <TextField
                            fullWidth
                            label="Username"
                            value={formData.username}
                            onChange={handleInputChange('username')}
                            error={!!fieldErrors.username}
                            helperText={fieldErrors.username}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        
                        <TextField
                            fullWidth
                            label="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange('fullName')}
                            disabled={loading}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        
                        <FormControl fullWidth disabled={loading}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={formData.role}
                                onChange={handleInputChange('role')}
                                label="Role"
                                sx={{ borderRadius: 2 }}
                            >
                                {USER_ROLES.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography>{role.label}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            fullWidth
                            label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password}
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
                            label="Confirm Password"
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
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={handleInputChange('isActive')}
                                    disabled={loading}
                                />
                            }
                            label="Active User"
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
                        disabled={loading}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 500,
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        {loading ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
