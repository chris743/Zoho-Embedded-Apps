import { useMemo, useState } from "react";
import { makeApi } from "../api/client";


export function useApiConfig() {
const [apiBase, setApiBase] = useState(() => {
  const stored = localStorage.getItem("apiBase");
  const defaultUrl = "https://api.cobblestonecloud.com/api/v1";
  
  // Auto-fix: If stored URL contains localhost, clear it and use the correct URL
  if (stored && (stored.includes('localhost') || stored.includes('5048'))) {
    console.log('🔧 Auto-fixing localhost API URL to production URL');
    localStorage.removeItem("apiBase");
    return defaultUrl;
  }
  
  return stored || defaultUrl;
});
const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
const api = useMemo(() => makeApi(apiBase, jwt), [apiBase, jwt]);
const save = () => {
localStorage.setItem("apiBase", apiBase);
localStorage.setItem("jwt", jwt);
};
return { apiBase, setApiBase, jwt, setJwt, api, save };
}
