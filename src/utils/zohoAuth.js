import { useState, useEffect } from 'react';

/**
 * Simple Zoho Token Authentication
 * Just validates Zoho tokens for access control - no CRM integration
 */

// Zoho OAuth endpoint for token validation
const ZOHO_OAUTH_BASE = 'https://accounts.zoho.com/oauth/v2';

/**
 * Validates a Zoho access token
 * @param {string} accessToken - The Zoho access token
 * @returns {Promise<boolean>} - Whether the token is valid
 */
export async function validateZohoToken(accessToken) {
    if (!accessToken) {
        return false;
    }

    try {
        const response = await fetch(`${ZOHO_OAUTH_BASE}/tokeninfo?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error) {
            console.warn('Zoho token validation failed:', data.error);
            return false;
        }
        
        // Check if token is not expired
        const expiresIn = data.expires_in_sec;
        if (expiresIn <= 0) {
            console.warn('Zoho token has expired');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating Zoho token:', error);
        return false;
    }
}

/**
 * Gets basic user information from token validation
 * @param {string} accessToken - The Zoho access token
 * @returns {Promise<Object|null>} - Basic user info or null if failed
 */
export async function getZohoUserInfo(accessToken) {
    if (!accessToken) {
        return null;
    }

    try {
        const response = await fetch(`${ZOHO_OAUTH_BASE}/tokeninfo?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error) {
            console.warn('Failed to get Zoho user info:', data.error);
            return null;
        }
        
        // Return basic info from token validation
        return {
            email: data.email || 'Unknown User',
            full_name: data.email || 'Zoho User',
            user_id: data.user_id || 'unknown'
        };
    } catch (error) {
        console.error('Error getting Zoho user info:', error);
        return null;
    }
}

/**
 * Extracts token from URL parameters or localStorage
 * @returns {string|null} - The access token or null
 */
export function getZohoToken() {
    // First, try to get token from URL parameters (for embedded apps)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('access_token') || urlParams.get('token');
    
    if (urlToken) {
        // Store in localStorage for future use
        localStorage.setItem('zoho_access_token', urlToken);
        return urlToken;
    }
    
    // Try to get from localStorage
    return localStorage.getItem('zoho_access_token');
}

/**
 * Stores Zoho token in localStorage
 * @param {string} token - The access token
 */
export function setZohoToken(token) {
    localStorage.setItem('zoho_access_token', token);
}

/**
 * Removes Zoho token from localStorage
 */
export function clearZohoToken() {
    localStorage.removeItem('zoho_access_token');
}

/**
 * Checks if the app is running in Zoho CRM context
 * @returns {boolean} - Whether the app is embedded in Zoho CRM
 */
export function isZohoEmbedded() {
    // Check if we're in an iframe (common for embedded apps)
    const isInIframe = window.self !== window.top;
    
    // Check for Zoho-specific URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasZohoParams = urlParams.has('access_token') || urlParams.has('token') || urlParams.has('zoho');
    
    // Check if parent window is Zoho (with error handling for cross-origin)
    let isZohoParent = false;
    try {
        if (window.parent && window.parent.location) {
            isZohoParent = window.parent.location.hostname.includes('zoho');
        }
    } catch (error) {
        // Cross-origin access blocked - this is expected when embedded
        // If we can't access parent location, we're likely in an iframe
        isZohoParent = isInIframe;
    }
    
    return isInIframe || hasZohoParams || isZohoParent;
}



/**
 * Authentication hook for React components
 * @returns {Object} - Authentication state and methods
 */
export function useZohoAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            
            try {
                const accessToken = getZohoToken();
                if (!accessToken) {
                    setLoading(false);
                    return;
                }

                const isValid = await validateZohoToken(accessToken);
                if (!isValid) {
                    clearZohoToken();
                    setLoading(false);
                    return;
                }

                const userInfo = await getZohoUserInfo(accessToken);
                
                setToken(accessToken);
                setIsAuthenticated(true);
                setUser(userInfo);
            } catch (error) {
                console.error('Error during authentication initialization:', error);
                clearZohoToken();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (accessToken) => {
        setZohoToken(accessToken);
        setToken(accessToken);
        setIsAuthenticated(true);
    };

    const logout = () => {
        clearZohoToken();
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
    };

    return {
        isAuthenticated,
        user,
        loading,
        token,
        login,
        logout,
        isZohoEmbedded: isZohoEmbedded()
    };
}
