// File: src/api/client.js
import axios from "axios";


export function makeApi(baseURL, jwt) {
const instance = axios.create({ baseURL });
instance.interceptors.request.use((cfg) => {
if (jwt && jwt.trim()) cfg.headers["Authorization"] = `Bearer ${jwt.trim()}`;
return cfg;
});
return instance;
}