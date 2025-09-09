import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Divider,
    Stack
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person as PersonIcon,
    Lock as LockIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export function LoginForm() {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleInputChange = (field) => (event) => {
        setCredentials(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!credentials.username.trim() || !credentials.password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await login(credentials);
        
        if (!result.success) {
            setError(result.error);
        }
        
        setIsLoading(false);
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSubmit(event);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.50',
                p: 3
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 420,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3
                }}
            >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            borderRadius: 2,
                            backgroundColor: 'primary.main',
                            mb: 2
                        }}
                    >
                        <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" fontWeight={600} gutterBottom>
                        Cobblestone
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sign in to your account
                    </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 3, borderRadius: 2 }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={credentials.username}
                            onChange={handleInputChange('username')}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={credentials.password}
                            onChange={handleInputChange('password')}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleTogglePasswordVisibility}
                                            edge="end"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </Stack>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 4 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Need access? Contact your administrator to create an account.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}