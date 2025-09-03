// File: src/api/client.js
import axios from "axios";
import { getZohoToken } from "../utils/zohoAuth";

export function makeApi(baseURL, jwt) {
    const instance = axios.create({ baseURL });
    
    instance.interceptors.request.use((cfg) => {
        // Use Zoho token for authentication if available, otherwise fall back to JWT
        const zohoToken = getZohoToken();
        
        if (zohoToken && zohoToken.trim()) {
            // Pass Zoho token to your backend - your backend can validate it
            cfg.headers["X-Zoho-Token"] = zohoToken.trim();
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