import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AuthApi } from '../api/auth';
import { makeApi } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Create API client with current token
    const apiClient = useMemo(() => {
        let apiBase = localStorage.getItem('apiBase');
        const defaultUrl = 'https://api.cobblestonecloud.com/api/v1';
        
        // Auto-fix: If stored URL contains localhost, clear it and use the correct URL
        if (apiBase && (apiBase.includes('localhost') || apiBase.includes('5048'))) {
            console.log('🔧 Auto-fixing localhost API URL to production URL');
            localStorage.removeItem('apiBase');
            apiBase = defaultUrl;
        } else {
            apiBase = apiBase || defaultUrl;
        }
        const currentToken = token || localStorage.getItem('authToken');
        console.log('🔍 Creating API client with token:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null');
        return makeApi(apiBase, currentToken);
    }, [token]);

    const authApi = useMemo(() => AuthApi(apiClient), [apiClient]);

    // Initialize authentication state
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('authUser');
            
            console.log('🔍 localStorage Debug:', {
                authToken: storedToken ? `${storedToken.substring(0, 20)}...` : 'null',
                authUser: storedUser ? 'exists' : 'null',
                allKeys: Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('token'))
            });
            
            // Check for corrupted token
            if (storedToken === 'undefined' || storedToken === 'null' || !storedToken || storedToken.length < 10) {
                console.log('❌ Corrupted or invalid token found, clearing auth data');
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            if (storedToken && storedUser) {
                try {
                    console.log('🔍 Verifying stored JWT token:', storedToken.substring(0, 20) + '...');
                    console.log('🔍 Full token for verification:', storedToken);
                    // Verify token is still valid
                    await authApi.verify();
                    console.log('✅ JWT token verification successful');
                    
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token is invalid, clear stored data
                    console.warn('❌ Stored token is invalid, clearing auth data');
                    console.warn('❌ Verification error:', error?.response?.status, error?.response?.data);
                    console.warn('❌ Error details:', error?.message);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authUser');
                    setToken(null);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                console.log('🔍 No stored JWT token found');
            }
            
            setLoading(false);
        };

        initializeAuth();
    }, [authApi]);

    const login = async (credentials) => {
        try {
            setLoading(true);
            const response = await authApi.login(credentials);
            
            console.log('🔍 Login response:', response);
            console.log('🔍 Response data:', response.data);
            console.log('🔍 Response data keys:', Object.keys(response.data || {}));
            
            // Try different possible response structures
            const newToken = response.data?.token || response.data?.accessToken || response.data?.access_token || response.data?.jwt;
            const userData = response.data?.user || response.data?.userData || response.data?.userInfo || { username: credentials.username };
            
            console.log('🔍 Extracted token:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
            console.log('🔍 Extracted user:', userData);
            
            if (!newToken) {
                console.error('❌ No token found in response');
                return { success: false, error: 'No token received from server' };
            }
            
            // Store authentication data
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(userData));
            
            setToken(newToken);
            setUser(userData);
            setIsAuthenticated(true);
            
            console.log('✅ Login successful, token stored');
            return { success: true };
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 
                               error?.response?.data?.title || 
                               error?.message || 
                               'Login failed';
            
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Attempt to logout on server (best effort)
            if (token) {
                await authApi.logout();
            }
        } catch (error) {
            // Continue with local logout even if server logout fails
            console.warn('Server logout failed, continuing with local logout');
        }
        
        // Clear local authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const refreshToken = async () => {
        try {
            const response = await authApi.refresh();
            const { token: newToken } = response.data;
            
            localStorage.setItem('authToken', newToken);
            setToken(newToken);
            
            return true;
        } catch (error) {
            // Refresh failed, logout user
            await logout();
            return false;
        }
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const clearCorruptedData = () => {
        console.log('🧹 Clearing corrupted authentication data...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshToken,
        updateUser,
        clearCorruptedData,
        apiClient
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};