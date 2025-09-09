import React from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useZohoAuth } from '../utils/zohoAuth';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';

/**
 * Combined Authentication Wrapper Component
 * Handles both Zoho CRM authentication and username/password authentication
 */
function AuthWrapper({ children }) {
    const { isAuthenticated: zohoAuth, user: zohoUser, loading: zohoLoading } = useZohoAuth();
    const { isAuthenticated: userAuth, loading: userLoading, user: authUser } = useAuth();
    
    // Debug authentication states
    console.log('🔍 AuthWrapper Debug:', {
        zohoAuth,
        userAuth,
        zohoLoading,
        userLoading,
        hasZohoUser: !!zohoUser,
        hasAuthUser: !!authUser,
        willShowLogin: !zohoAuth && !userAuth && !zohoLoading && !userLoading
    });

    // Show loading spinner while checking authentication
    if (zohoLoading || userLoading) {
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
                    {zohoLoading ? 'Checking session key...' : 'Checking authentication...'}
                </Typography>
            </Box>
        );
    }

    // If we have any authentication, proceed with the app
    if (zohoAuth || userAuth) {
        return (
            <Box>
                {/* Optional: Show user info banner */}
                {zohoUser && (
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
                            Welcome, {zohoUser.full_name || zohoUser.email} | 
                            Session Key Authentication Active
                        </Typography>
                    </Box>
                )}
                {authUser && !zohoUser && (
                    <Box 
                        sx={{ 
                            bgcolor: 'info.light', 
                            color: 'info.contrastText',
                            p: 1, 
                            textAlign: 'center',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Typography variant="body2">
                            Welcome, {authUser.username || authUser.email} | 
                            Backend Authentication Active
                        </Typography>
                    </Box>
                )}
                {children}
            </Box>
        );
    }

    // Show login form for external users
    return <LoginForm />;
}

export function ZohoAuthWrapper({ children }) {
    return (
        <AuthProvider>
            <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
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
