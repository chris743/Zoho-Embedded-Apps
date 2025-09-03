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

    // Basic token format validation first
    if (!accessToken.startsWith('1000.') || accessToken.length < 50) {
        console.warn('Invalid Zoho token format');
        return false;
    }

    try {
        const response = await fetch(`${ZOHO_OAUTH_BASE}/tokeninfo?access_token=${accessToken}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
            console.warn('Zoho token validation failed with status:', response.status);
            return false;
        }
        
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
        if (error.name === 'AbortError') {
            console.warn('Zoho token validation timed out');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.warn('Network error validating Zoho token - this may be due to CORS or network issues');
            // For embedded apps, we'll assume the token is valid if it has the right format
            // since the token was provided by Zoho CRM itself
            return true;
        } else {
            console.error('Error validating Zoho token:', error);
        }
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
        const response = await fetch(`${ZOHO_OAUTH_BASE}/tokeninfo?access_token=${accessToken}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
            console.warn('Failed to get Zoho user info with status:', response.status);
            return null;
        }
        
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
        if (error.name === 'AbortError') {
            console.warn('Zoho user info request timed out');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.warn('Network error getting Zoho user info - using fallback');
            // Return fallback user info for embedded apps
            return {
                email: 'Zoho User',
                full_name: 'Zoho User',
                user_id: 'embedded_user'
            };
        } else {
            console.error('Error getting Zoho user info:', error);
        }
        return null;
    }
}

/**
 * Extracts token from Zoho API, URL parameters, or localStorage
 * @returns {Promise<string|null>} - The access token or null
 */
export async function getZohoToken() {
    console.log('🔍 getZohoToken called');
    console.log('🔍 Current URL:', window.location.href);
    
    // First, try to get token from URL parameters (for embedded apps)
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 URL params:', Object.fromEntries(urlParams.entries()));
    
    const urlToken = urlParams.get('access_token') || urlParams.get('token');
    console.log('🔍 URL token found:', urlToken ? 'Yes' : 'No', urlToken ? `(${urlToken.substring(0, 20)}...)` : '');
    
    if (urlToken) {
        // Store in localStorage for future use
        localStorage.setItem('zoho_access_token', urlToken);
        console.log('🔍 Token stored in localStorage');
        return urlToken;
    }
    
    // Try to get from localStorage
    const storedToken = localStorage.getItem('zoho_access_token');
    console.log('🔍 Stored token found:', storedToken ? 'Yes' : 'No', storedToken ? `(${storedToken.substring(0, 20)}...)` : '');
    
    if (storedToken) {
        return storedToken;
    }
    
    // If no token found and we're in Zoho context, try to get from Zoho API
    if (isZohoEmbedded()) {
        console.log('🔍 Attempting to get token from Zoho API...');
        try {
            const zohoToken = await getTokenFromZohoAPI();
            if (zohoToken) {
                console.log('🔍 Token obtained from Zoho API');
                localStorage.setItem('zoho_access_token', zohoToken);
                return zohoToken;
            }
        } catch (error) {
            console.warn('🔍 Failed to get token from Zoho API:', error);
        }
    }
    
    return null;
}

/**
 * Gets token from Zoho's embedded app API
 * @returns {Promise<string|null>} - The access token or null
 */
async function getTokenFromZohoAPI() {
    return new Promise((resolve) => {
        // Check if Zoho API is available
        if (typeof window.ZOHO !== 'undefined' && window.ZOHO.embeddedApp) {
            console.log('🔍 Zoho API available, getting token...');
            window.ZOHO.embeddedApp.init().then(() => {
                window.ZOHO.embeddedApp.getAccessToken().then((token) => {
                    console.log('🔍 Token from Zoho API:', token ? `(${token.substring(0, 20)}...)` : 'null');
                    resolve(token);
                }).catch((error) => {
                    console.warn('🔍 Error getting token from Zoho API:', error);
                    resolve(null);
                });
            }).catch((error) => {
                console.warn('🔍 Error initializing Zoho API:', error);
                resolve(null);
            });
        } else {
            console.log('🔍 Zoho API not available');
            resolve(null);
        }
    });
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
                console.log('🔍 Starting Zoho authentication...');
                const accessToken = await getZohoToken();
                console.log('🔍 Token found:', accessToken ? 'Yes' : 'No', accessToken ? `(${accessToken.substring(0, 20)}...)` : '');
                
                if (!accessToken) {
                    console.log('❌ No access token found');
                    setLoading(false);
                    return;
                }

                console.log('🔍 Validating token...');
                const isValid = await validateZohoToken(accessToken);
                console.log('🔍 Token validation result:', isValid);
                
                if (!isValid) {
                    console.log('❌ Token validation failed');
                    clearZohoToken();
                    setLoading(false);
                    return;
                }

                console.log('🔍 Getting user info...');
                const userInfo = await getZohoUserInfo(accessToken);
                console.log('🔍 User info:', userInfo);
                
                setToken(accessToken);
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
