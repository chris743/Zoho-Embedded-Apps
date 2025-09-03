// File: src/api/client.js
import axios from "axios";
import { getSessionKey } from "../utils/zohoAuth";

export function makeApi(baseURL, jwt) {
    const instance = axios.create({ baseURL });
    
    instance.interceptors.request.use((cfg) => {
        // Use session key for authentication if available, otherwise fall back to JWT
        const sessionKey = getSessionKey();
        
        if (sessionKey && sessionKey.trim()) {
            // Pass session key to your backend - your backend can validate it
            cfg.headers["X-Session-Key"] = sessionKey.trim();
            // Keep existing JWT for backend compatibility
            if (jwt && jwt.trim()) {
                cfg.headers["Authorization"] = `Bearer ${jwt.trim()}`;
            }
        } else if (jwt && jwt.trim()) {
            cfg.headers["Authorization"] = `Bearer ${jwt.trim()}`;
        }
        
        return cfg;
    });
    
    return instance;
}