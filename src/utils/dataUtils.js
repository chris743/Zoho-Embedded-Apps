// Consolidated data utilities for the entire application
import { toYMD } from './dateUtils';
import { getCommodityIdxFromBlockOrPlan, buildCommodityMap } from './commodities';

// Block mapping utilities
export function createBlockMap(blocks) {
    const map = new Map();
    for (const block of blocks || []) {
        const src = block.source_database ?? block.sourceDatabase;
        const idx = block.GABLOCKIDX ?? block.gablockidx ?? block.id;
        if (src != null && idx != null) {
            map.set(`${src}:${idx}`, block);
        }
    }
    return map;
}

// Contractor mapping utilities
export function createContractorMap(contractors) {
    const map = new Map();
    for (const contractor of contractors || []) {
        const id = contractor.id ?? contractor.ID ?? contractor.contractor_id;
        if (id != null) {
            map.set(Number(id), contractor);
        }
    }
    return map;
}

// Pool mapping utilities
export function createPoolMap(pools) {
    const map = new Map();
    for (const pool of pools || []) {
        const id = pool.id ?? pool.ID ?? pool.pool_id;
        if (id != null) {
            map.set(Number(id), pool);
        }
    }
    return map;
}

export function buildPoolMap(pools, onlyCobblestone = true) {
    const map = new Map();
    for (const pool of pools || []) {
        // optional source filter
        const src = (pool.source_database ?? pool.SOURCE_DATABASE ?? "").toString().toLowerCase();
        if (onlyCobblestone && src && src !== "cobblestone") continue;

        // be defensive about id/name casings & variants
        const idx = pool.poolIDx ?? pool.poolIdx ?? pool.POOLIDX ?? pool.id ?? pool.code;
        const name = pool.pool ?? pool.DESCR ?? pool.descr ?? pool.name ?? pool.NAME ?? String(idx ?? "");

        if (idx != null) map.set(String(idx), String(name));
    }
    return map;
}

export function getPoolIdxFromPlan(plan) {
    return plan?.pool_id ?? plan?.poolId ?? plan?.poolIDx ?? plan?.poolIdx ?? null;
}

// Commodity mapping utilities
export function createCommodityMap(commodities) {
    return buildCommodityMap(commodities, false); // Include all sources, not just cobblestone
}

// Build a map of received bins by blockID and date
// Supports multiple blockID formats: blockID (string) can match Block.ID or Block.GABLOCKIDX (as string)
export function buildReceivedBinsMap(binsReceived, dayKeys) {
    const map = new Map(); // key: `${blockID}:${date}` -> total received bins
    
    for (const bin of binsReceived || []) {
        const blockID = bin.blockID ?? bin.blockId;
        const receiveDate = bin.ReceiveDate ?? bin.receiveDate;
        const recvQnt = bin.RecvQnt ?? bin.recvQnt ?? 0;
        
        if (blockID && receiveDate) {
            const blockIDStr = String(blockID); // Normalize to string
            const dateStr = toYMD(new Date(receiveDate));
            const key = `${blockIDStr}:${dateStr}`;
            
            const currentTotal = map.get(key) || 0;
            map.set(key, currentTotal + (recvQnt || 0));
        }
    }
    
    return map;
}

// Plan enrichment utilities - updated for new data structure
export function enrichPlan(plan, { contractors, fieldRepresentatives = new Map(), receivedBinsMap = new Map() }) {
    const contractor = contractors.get(plan.contractor_id ?? -1);
    const fieldRep = fieldRepresentatives.get(plan.field_representative_id);
    const block = plan.block;
    const commodity = plan.commodity;

    // Check if this is a placeholder block
    const isPlaceholder = plan.grower_block_source_database === "PLACEHOLDER" && plan.grower_block_id === 999999;
    
    // Extract placeholder grower name from notes if it exists
    let placeholderGrowerName = '';
    let placeholderCommodityName = '';
    
    if (isPlaceholder && plan.notes_general) {
        const placeholderMatch = plan.notes_general.match(/PLACEHOLDER GROWER: ([^|]+) \| COMMODITY: ([^\n]+)/);
        if (placeholderMatch) {
            placeholderGrowerName = placeholderMatch[1].trim();
            placeholderCommodityName = placeholderMatch[2].trim();
        }
    }

    // For placeholder blocks, use the placeholder grower name instead of 999999
    const blockName = isPlaceholder && placeholderGrowerName 
        ? placeholderGrowerName 
        : (block?.name ?? `${plan.grower_block_id}`);
    
    const growerName = isPlaceholder && placeholderGrowerName 
        ? placeholderGrowerName 
        : (block?.growerName ?? "");
    
    // For placeholder blocks, use the placeholder commodity name if available
    const commodityName = isPlaceholder && placeholderCommodityName
        ? placeholderCommodityName
        : (commodity?.commodity || commodity?.invoiceCommodity || "");

    // Get received bins for this block and date
    // BinsReceived.blockID (string) can match Block.ID (string) or Block.GABLOCKIDX (int, converted to string)
    // Try both Block.ID and Block.GABLOCKIDX to match with receivings
    const planDate = plan.date ? toYMD(new Date(plan.date)) : null;
    
    let receivedBins = null;
    if (planDate && block) {
        // Try matching with Block.ID (string field) first
        if (block.ID) {
            const key1 = `${String(block.ID)}:${planDate}`;
            const bins1 = receivedBinsMap.get(key1);
            if (bins1 !== undefined) { // Map has this key (even if value is 0)
                receivedBins = bins1;
            }
        }
        
        // Also try matching with Block.GABLOCKIDX (int field, converted to string) if Block.ID didn't match
        if (receivedBins === null && block.GABLOCKIDX != null) {
            const key2 = `${String(block.GABLOCKIDX)}:${planDate}`;
            const bins2 = receivedBinsMap.get(key2);
            if (bins2 !== undefined) { // Map has this key (even if value is 0)
                receivedBins = bins2;
            }
        }
    }

    return {
        ...plan,
        _card: {
            blockName: blockName,
            strippedBlockname: block?.name,
            blockID: block?.id,
            estimatedBins: receivedBins != null ? receivedBins : block?.acres, // Use received bins if available, otherwise acres
            growerName: growerName,
            grower: growerName,
            commodityName: commodityName,
            commodityIdx: null, // No longer needed with new structure
            contractorName: contractor?.name ?? contractor?.NAME ?? "",
            fieldRepresentativeName: fieldRep?.fullName || fieldRep?.full_name || fieldRep?.username || "",
            block: block, // Include full block object for additional data access
        }
    };
}

// Process plan enrichment utilities
export function enrichProcessPlan(plan, { blocks, pools, contractors, commodities }) {
    const blockKey = `${plan.source_database}:${plan.GABLOCKIDX}`;
    const block = blocks.get(blockKey);
    const pool = pools.get(plan.pool);
    const contractor = contractors.get(plan.contractor);
    const commodity = block?.commodity ? commodities.get(block.commodity) : null;

    return {
        ...plan,
        _card: {
            blockName: block?.name || 'Unknown Block',
            blockID: block?.id,
            poolName: pool?.name,
            contractorName: contractor?.name,
            commodityName: commodity?.name,
            commodity: commodity,
            block: block,
            pool: pool,
            contractor: contractor
        }
    };
}

// Bucket building utilities
export function buildBuckets(plans, dayKeys, lookupMaps, binsReceived = []) {
    const buckets = {};

    // Initialize empty buckets
    for (const key of dayKeys) {
        buckets[key] = [];
    }

    // Build received bins map
    const receivedBinsMap = buildReceivedBinsMap(binsReceived, dayKeys);

    // Populate buckets with enriched plans
    for (const plan of plans || []) {
        const ymd = toYMD(plan.date);
        if (buckets[ymd]) {
            buckets[ymd].push(enrichPlan(plan, { 
                contractors: lookupMaps.contractors,
                fieldRepresentatives: lookupMaps.fieldRepresentatives || new Map(),
                receivedBinsMap: receivedBinsMap
            }));
        }
    }

    // Sort each day's plans by commodity first, then by planned bins
    for (const key of dayKeys) {
        buckets[key] = sortPlansByCommodityAndBins(buckets[key]);
    }

    return buckets;
}

// Process plan bucket building utilities
export function buildProcessBuckets(plans, dayKeys, lookupMaps) {
    const buckets = {};

    // Initialize empty buckets
    for (const key of dayKeys) {
        buckets[key] = [];
    }

    // Sort plans by run_date, then row_order
    const sortedPlans = [...plans].sort((a, b) => {
        const dateA = new Date(a.run_date || 0);
        const dateB = new Date(b.run_date || 0);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return (a.row_order || 0) - (b.row_order || 0);
    });

    // Distribute plans to appropriate days
    sortedPlans.forEach(plan => {
        const runDate = plan.run_date ? toYMD(new Date(plan.run_date)) : null;
        if (runDate && buckets[runDate]) {
            buckets[runDate].push(enrichProcessPlan(plan, lookupMaps));
        }
    });

    return buckets;
}

// Sorting utilities
export function sortPlansByCommodityAndBins(plans) {
    return [...plans].sort((a, b) => {
        // First sort by commodity name
        const commodityA = a._card?.commodityName || "";
        const commodityB = b._card?.commodityName || "";
        const commodityCompare = commodityA.localeCompare(commodityB);
        
        if (commodityCompare !== 0) {
            return commodityCompare;
        }
        
        // If commodities are the same, sort by planned bins (descending - higher bins first)
        const binsA = a.planned_bins || 0;
        const binsB = b.planned_bins || 0;
        return binsB - binsA;
    });
}

// Formatting utilities
export function formatBinInfo(planned, actual, estimatedBins) {
    const parts = [];
    if (planned != null) parts.push(`Planned: ${planned}`);
    if (actual != null) parts.push(`Actual: ${actual}`);
    if (estimatedBins != null) parts.push(`Received: ${estimatedBins}`)
    return parts.join(" · ");
}

export function formatRate(rate) {
    if (rate == null || rate === "") return "-";
    const num = Number(rate);
    if (isNaN(num)) return rate;
    return `$${num.toFixed(2)}`;
}

export function formatCoordinate(coord) {
    if (coord == null || coord === "") return "-";
    const num = Number(coord);
    if (isNaN(num)) return coord;
    return num.toFixed(6);
}

// Search and filter utilities
export function searchPlans(plans, searchTerm, lookupMaps) {
    if (!searchTerm.trim()) return plans;
    
    const searchLower = searchTerm.toLowerCase();
    return plans.filter(plan => {
        const block = lookupMaps.blocks.get(`${plan.grower_block_source_database}:${plan.grower_block_id}`);
        const contractor = lookupMaps.contractors.get(plan.contractor_id);
        
        return (
            (block?.name || '').toLowerCase().includes(searchLower) ||
            (contractor?.name || '').toLowerCase().includes(searchLower) ||
            (plan.notes || '').toLowerCase().includes(searchLower)
        );
    });
}

export function searchProcessPlans(plans, searchTerm, lookupMaps) {
    if (!searchTerm.trim()) return plans;
    
    const searchLower = searchTerm.toLowerCase();
    return plans.filter(plan => {
        const block = lookupMaps.blocks.get(`${plan.source_database}:${plan.GABLOCKIDX}`);
        const pool = lookupMaps.pools.get(plan.pool);
        const contractor = lookupMaps.contractors.get(plan.contractor);
        
        return (
            (block?.name || '').toLowerCase().includes(searchLower) ||
            (pool?.name || '').toLowerCase().includes(searchLower) ||
            (contractor?.name || '').toLowerCase().includes(searchLower) ||
            (plan.batch_id || '').toLowerCase().includes(searchLower) ||
            (plan.notes || '').toLowerCase().includes(searchLower)
        );
    });
}
