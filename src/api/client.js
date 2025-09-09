// File: src/api/client.js
import axios from "axios";
import { getSessionKey } from "../utils/zohoAuth";

export function makeApi(baseURL, jwt) {
    const instance = axios.create({ baseURL });
    
    instance.interceptors.request.use((cfg) => {
        // Use session key for authentication if available, otherwise fall back to JWT
        const sessionKey = getSessionKey();
        
        console.log('🔍 API Request Debug:', {
            url: cfg.url,
            method: cfg.method,
            sessionKey: sessionKey ? `${sessionKey.substring(0, 10)}...` : 'null',
            jwt: jwt ? `${jwt.substring(0, 10)}...` : 'null'
        });
        
        if (sessionKey && sessionKey.trim()) {
            // Pass session key to your backend - your backend can validate it
            cfg.headers["X-Session-Key"] = sessionKey.trim();
            console.log('🔍 Added X-Session-Key header');
            // Keep existing JWT for backend compatibility
            if (jwt && jwt.trim()) {
                cfg.headers["Authorization"] = `Bearer ${jwt.trim()}`;
                console.log('🔍 Added Authorization header');
            }
        } else if (jwt && jwt.trim()) {
            cfg.headers["Authorization"] = `Bearer ${jwt.trim()}`;
            console.log('🔍 Added Authorization header (JWT only)');
        } else {
            console.log('❌ No authentication headers added');
        }
        
        console.log('🔍 Final headers:', Object.keys(cfg.headers).filter(key => 
            key.toLowerCase().includes('auth') || key.toLowerCase().includes('session')
        ));
        
        return cfg;
    });
    
    return instance;
}