import { useState, useEffect } from 'react';

/**
 * Simple Zoho Token Authentication
 * Just validates Zoho tokens for access control - no CRM integration
 */



/**
 * Validates a session key
 * @param {string} sessionKey - The session key
 * @returns {Promise<boolean>} - Whether the session key is valid
 */
export async function validateZohoToken(sessionKey) {
    if (!sessionKey) {
        return false;
    }

    // Define your static session key here
    const VALID_SESSION_KEY = '951c0464a277176d1ebddc4c067151f9739f3a3deb';
    
    // Simple string comparison
    if (sessionKey === VALID_SESSION_KEY) {
        console.log('✅ Valid session key provided');
        return true;
    }
    
    console.warn('❌ Invalid session key provided');
    return false;
}

/**
 * Gets basic user information for session key authentication
 * @param {string} sessionKey - The session key
 * @returns {Promise<Object|null>} - Basic user info or null if failed
 */
export async function getZohoUserInfo(sessionKey) {
    if (!sessionKey) {
        return null;
    }

    // Return basic user info for session key authentication
    return {
        email: 'harvest.user@company.com',
        full_name: 'Harvest Planner User',
        user_id: 'session_user'
    };
}

/**
 * Extracts session key from URL parameters or localStorage
 * @returns {string|null} - The session key or null
 */
export function getZohoToken() {
    console.log('🔍 getZohoToken called');
    console.log('🔍 Current URL:', window.location.href);
    
    // Check for session key in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 URL params:', Object.fromEntries(urlParams.entries()));
    
    const sessionKey = urlParams.get('key') || urlParams.get('session') || urlParams.get('auth');
    console.log('🔍 Session key found:', sessionKey ? 'Yes' : 'No', sessionKey ? `(${sessionKey.substring(0, 10)}...)` : '');
    
    if (sessionKey) {
        // Store in localStorage for future use
        localStorage.setItem('zoho_access_token', sessionKey);
        console.log('🔍 Session key stored in localStorage');
        return sessionKey;
    }
    
    // Try to get from localStorage
    const storedKey = localStorage.getItem('zoho_access_token');
    console.log('🔍 Stored session key found:', storedKey ? 'Yes' : 'No', storedKey ? `(${storedKey.substring(0, 10)}...)` : '');
    
    return storedKey;
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
    console.log('🔍 isZohoEmbedded - isInIframe:', isInIframe);
    
    // Check for Zoho-specific URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasZohoParams = urlParams.has('access_token') || urlParams.has('token') || urlParams.has('zoho');
    console.log('🔍 isZohoEmbedded - hasZohoParams:', hasZohoParams);
    
    // Check if parent window is Zoho (with error handling for cross-origin)
    let isZohoParent = false;
    try {
        if (window.parent && window.parent.location) {
            isZohoParent = window.parent.location.hostname.includes('zoho');
            console.log('🔍 isZohoEmbedded - isZohoParent:', isZohoParent);
        }
    } catch (error) {
        // Cross-origin access blocked - this is expected when embedded
        // If we can't access parent location, we're likely in an iframe
        isZohoParent = isInIframe;
        console.log('🔍 isZohoEmbedded - cross-origin error, using isInIframe:', isZohoParent);
    }
    
    const result = isInIframe || hasZohoParams || isZohoParent;
    console.log('🔍 isZohoEmbedded - final result:', result);
    return result;
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
                console.log('🔍 Starting session key authentication...');
                const sessionKey = getZohoToken();
                console.log('🔍 Session key found:', sessionKey ? 'Yes' : 'No', sessionKey ? `(${sessionKey.substring(0, 10)}...)` : '');
                
                if (!sessionKey) {
                    console.log('❌ No session key found');
                    setLoading(false);
                    return;
                }

                console.log('🔍 Validating session key...');
                const isValid = await validateZohoToken(sessionKey);
                console.log('🔍 Session key validation result:', isValid);
                
                if (!isValid) {
                    console.log('❌ Session key validation failed');
                    clearZohoToken();
                    setLoading(false);
                    return;
                }

                console.log('🔍 Getting user info...');
                const userInfo = await getZohoUserInfo(sessionKey);
                console.log('🔍 User info:', userInfo);
                
                setToken(sessionKey);
                setIsAuthenticated(true);
                setUser(userInfo);
                console.log('✅ Authentication successful');
            } catch (error) {
                console.error('❌ Error during authentication initialization:', error);
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
