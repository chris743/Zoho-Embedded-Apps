import axios from 'axios'

const api = axios.create({ baseURL: "https://api.cobblestonecloud.com", withCredentials: true });

let OFFLINE  = false

function normalizeList(payload){
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (payload && Array.isArray(payload.value)) return payload.value;
    if (payload && Array.isArray(payload.results)) return payload.results;
    return [];
}

function ensureDemoSeed() {
const key = "ph_seed";
const raw = localStorage.getItem(key);
if (!raw) {
const seed = [
{ id: 1, cropName: "Honeycrisp", field: "North 40", plannedDate: new Date().toISOString().slice(0, 10), quantity: 12, unit: "bins", notes: "Priority" },
{ id: 2, cropName: "Gala", field: "Block B", plannedDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), quantity: 8, unit: "bins" },
];
localStorage.setItem(key, JSON.stringify(seed));
return seed;
}
try { return JSON.parse(raw); } catch { localStorage.removeItem(key); return ensureDemoSeed(); }
}


function readDemo() { return JSON.parse(localStorage.getItem("ph_seed") || "[]"); }
function writeDemo(list) { localStorage.setItem("ph_seed", JSON.stringify(list)); }


export function usingOffline() { return OFFLINE; }

export async function fetchHarvestLookups() {
    try {
    const blocks = await api.get("/data/blocks");
    const contractors = await api.get("/data/fieldContractors");
    const pools = await api.get("/data/pools");

    const blocksData = blocks.data || {};
    const contractorsData = contractors.data || {};
    const poolsData = pools.Data || {};
    return {
      growerBlocks: normalizeList(blocksData.grower_blocks ?? blocksData.blocks ?? blocksData.growerBlocks),
      contractors: normalizeList(contractorsData.contractors ?? contractorsData.Contractors),
      haulers: normalizeList(contractorsData.haulers ?? contractorsData.Haulers),
      forkliftContractors: normalizeList(contractorsData.forklift_contractors ?? contractorsData.ForkliftContractors),
      pools: normalizeList(poolsData.pools ?? poolsData.Pools),
    };
    } catch {
        const results = await Promise.allSettled([
            api.get("/data/blocks"),
            api.get("data/fieldContractors"),
            api.get("/data/pools")
        ]);
        const pick = (i) =>
            results[i].status ==="fulfilled"
                ?normalizeList(results[i].value.data).map((o) => ({
                    id: o.id ?? o.Id,
                    name: o.name ?? o.Name ?? o.blockName ?? o.block_name,
                }))
                :[];
            return {
                growerBlocks: pick(0),
                contractors: pick(1),
                pools: pick(2)
            };
    }
}


export async function fetchPlannedHarvests() {
try {
    const r = await api.get("/planned-harvests");
    OFFLINE = false;
    return r.data;
    } catch (e) {
        OFFLINE = true;
        console.log("no data returned from endpoint", api)
        return ensureDemoSeed();
    }
}

export async function createPlannedHarvest(body) {
    if (OFFLINE) {
        const list = readDemo();
        const nextId = (list.at(-1)?.id ?? 0) + 1;
        const item = { ...body, id: nextId};
        const updated = [...list, item];
        writeDemo(updated);
        return item;
    }
    const r= await api.post("/planned-harvests", body);
    return r.data;
}

export async function updatePlannedHarvest(id, body){
    if (OFFLINE) {
        const list = readDemo();
        const updated = list.map((x) => (x.id === id ? { ...x, ...body, id } : x))
        writeDemo(updated);
        return updated.find((x) => x.id === id);
    }
    const r = await api.put(`/planned-harvests/${id}`, {...body, id});
    return r.data;
}

export async function deletePlannedHarvest(id) {
    if (OFFLINE) {
        const list = readDemo();
        writeDemo(list.filter((x) => x.id !== id));
        return;
    }
    await api.delete(`/planned-harvests/${id}`);
}