import { useMemo, useState } from "react";
import { makeApi } from "../api/client";


export function useApiConfig() {
const [apiBase, setApiBase] = useState(() => localStorage.getItem("apiBase") || "https://api.cobblestonecloud.com");
const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
const api = useMemo(() => makeApi(apiBase, jwt), [apiBase, jwt]);
const save = () => {
localStorage.setItem("apiBase", apiBase);
localStorage.setItem("jwt", jwt);
};
return { apiBase, setApiBase, jwt, setJwt, api, save };
}