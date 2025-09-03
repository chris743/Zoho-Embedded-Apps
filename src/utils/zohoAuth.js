import { useState, useEffect } from 'react';

/**
 * Simple Session Key Authentication
 * Validates session keys for access control
 */



/**
 * Validates a session key
 * @param {string} sessionKey - The session key
 * @returns {Promise<boolean>} - Whether the session key is valid
 */
export async function validateSessionKey(sessionKey) {
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
export async function getUserInfo(sessionKey) {
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
export function getSessionKey() {
    console.log('🔍 getSessionKey called');
    console.log('🔍 Current URL:', window.location.href);
    
    // Check for session key in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 URL params:', Object.fromEntries(urlParams.entries()));
    
    const sessionKey = urlParams.get('key') || urlParams.get('session') || urlParams.get('auth');
    console.log('🔍 Session key found:', sessionKey ? 'Yes' : 'No', sessionKey ? `(${sessionKey.substring(0, 10)}...)` : '');
    
    if (sessionKey) {
        // Store in localStorage for future use
        localStorage.setItem('harvest_session_key', sessionKey);
        console.log('🔍 Session key stored in localStorage');
        return sessionKey;
    }
    
    // Try to get from localStorage
    const storedKey = localStorage.getItem('harvest_session_key');
    console.log('🔍 Stored session key found:', storedKey ? 'Yes' : 'No', storedKey ? `(${storedKey.substring(0, 10)}...)` : '');
    
    return storedKey;
}



/**
 * Stores session key in localStorage
 * @param {string} token - The session key
 */
export function setSessionKey(token) {
    localStorage.setItem('harvest_session_key', token);
}

/**
 * Removes session key from localStorage
 */
export function clearSessionKey() {
    localStorage.removeItem('harvest_session_key');
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
                const sessionKey = getSessionKey();
                console.log('🔍 Session key found:', sessionKey ? 'Yes' : 'No', sessionKey ? `(${sessionKey.substring(0, 10)}...)` : '');
                
                if (!sessionKey) {
                    console.log('❌ No session key found');
                    setLoading(false);
                    return;
                }

                console.log('🔍 Validating session key...');
                const isValid = await validateSessionKey(sessionKey);
                console.log('🔍 Session key validation result:', isValid);
                
                if (!isValid) {
                    console.log('❌ Session key validation failed');
                    clearSessionKey();
                    setLoading(false);
                    return;
                }

                console.log('🔍 Getting user info...');
                const userInfo = await getUserInfo(sessionKey);
                console.log('🔍 User info:', userInfo);
                
                setToken(sessionKey);
                setIsAuthenticated(true);
                setUser(userInfo);
                console.log('✅ Authentication successful');
            } catch (error) {
                console.error('❌ Error during authentication initialization:', error);
                clearSessionKey();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (sessionKey) => {
        setSessionKey(sessionKey);
        setToken(sessionKey);
        setIsAuthenticated(true);
    };

    const logout = () => {
        clearSessionKey();
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
        logout
    };
}
