import React from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useZohoAuth } from '../utils/zohoAuth';

/**
 * Zoho Authentication Wrapper Component
 * Protects the app and only allows access with valid Zoho tokens
 */
export function ZohoAuthWrapper({ children }) {
    const { isAuthenticated, user, loading, isZohoEmbedded } = useZohoAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    minHeight: '100vh',
                    gap: 2
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Authenticating with Zoho CRM...
                </Typography>
            </Box>
        );
    }

    // Show error if not authenticated
    if (!isAuthenticated) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    minHeight: '100vh',
                    gap: 3,
                    p: 3
                }}
            >
                <Alert severity="error" sx={{ maxWidth: 600, width: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                        Authentication Required
                    </Typography>
                    <Typography variant="body1" paragraph>
                        This application requires authentication through Zoho CRM. 
                        Please access this application through your Zoho CRM dashboard.
                    </Typography>
                    {!isZohoEmbedded && (
                        <Typography variant="body2" color="text.secondary">
                            If you're trying to access this directly, please ensure you have the proper 
                            Zoho CRM access token in the URL parameters.
                        </Typography>
                    )}
                </Alert>
                
                <Button 
                    variant="contained" 
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                >
                    Retry Authentication
                </Button>
            </Box>
        );
    }

    // Show success message and user info
    return (
        <Box>
            {/* Optional: Show user info banner */}
            {user && (
                <Box 
                    sx={{ 
                        bgcolor: 'success.light', 
                        color: 'success.contrastText',
                        p: 1, 
                        textAlign: 'center',
                        fontSize: '0.875rem'
                    }}
                >
                    <Typography variant="body2">
                        Welcome, {user.full_name || user.email} | 
                        Zoho CRM Integration Active
                    </Typography>
                </Box>
            )}
            
            {/* Render the main application */}
            {children}
        </Box>
    );
}

/**
 * Higher-order component for Zoho authentication
 * @param {React.Component} WrappedComponent - Component to wrap with authentication
 * @returns {React.Component} - Authenticated component
 */
export function withZohoAuth(WrappedComponent) {
    return function AuthenticatedComponent(props) {
        return (
            <ZohoAuthWrapper>
                <WrappedComponent {...props} />
            </ZohoAuthWrapper>
        );
    };
}
