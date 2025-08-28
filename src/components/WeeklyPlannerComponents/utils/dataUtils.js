import {
    toYMD,
} from './dateUtils';

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

export function createCommodityMap(commodities) {
    const map = new Map();
    for (const commodity of commodities || []) {
        const src = (commodity.source_database ?? commodity.SOURCE_DATABASE ?? "")
            .toString().toLowerCase();
        if (src && src !== "cobblestone") continue;

        const idx = commodity.CMTYIDX ?? commodity.cmtyidx ?? commodity.id ?? commodity.code;
        const name = commodity.DESCR ?? commodity.descr ?? commodity.name ??
            commodity.NAME ?? String(idx ?? "");

        if (idx != null) {
            map.set(String(idx), String(name));
        }
    }
    return map;
}

export function enrichPlan(plan, { blocks, contractors, commodities }) {
    const blockKey = `${plan.grower_block_source_database}:${plan.grower_block_id}`;
    const block = blocks.get(blockKey);
    const blockID = block.id;
    const blockName = block.name;
    const estimatedBins = block.estimatedbins;
    const growerName = block.growerName;
    const contractor = contractors.get(plan.contractor_id ?? -1);
    const commodityIdx = block?.CMTYIDX ?? block?.cmtyidx ?? block?.VARIETYIDX ?? null;
    const commodityName = commodityIdx != null ?
        (commodities.get(String(commodityIdx)) ?? "") : "";

    return {
        ...plan,
        _card: {
            blockName: block?.NAME ?? block?.name ?? `${plan.grower_block_id}`,
            strippedBlockname: blockName,
            blockID: blockID,
            estimatedBins: estimatedBins,
            growerName: growerName,
            grower: block?.GrowerName ?? block?.growerName ?? "",
            commodityName,
            contractorName: contractor?.name ?? contractor?.NAME ?? "",
        }
    };
}

export function buildBuckets(plans, dayKeys, lookupMaps) {
    const buckets = {};

    // Initialize empty buckets
    for (const key of dayKeys) {
        buckets[key] = [];
    }

    // Populate buckets with enriched plans
    for (const plan of plans || []) {
        const ymd = toYMD(plan.date);
        if (buckets[ymd]) {
            buckets[ymd].push(enrichPlan(plan, lookupMaps));
        }
    }

    // Sort each day's plans
    for (const key of dayKeys) {
        buckets[key].sort((a, b) =>
            (a._card.blockName || "").localeCompare(b._card.blockName || "")
        );
    }

    return buckets;
}

export function formatBinInfo(planned, actual, estimatedBins) {
    const parts = [];
    if (planned != null) parts.push(`Planned: ${planned}`);
    if (actual != null) parts.push(`Actual: ${actual}`);
    if (estimatedBins != null) parts.push(`Remaining: ${estimatedBins}`)
    return parts.join(" · ");
}