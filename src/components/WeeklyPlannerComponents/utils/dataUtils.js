import {
    toYMD,
} from './dateUtils';
import { getCommodityIdxFromBlockOrPlan, buildCommodityMap } from "../../utils/commodities";

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
    return buildCommodityMap(commodities, true);
}

export function enrichPlan(plan, { blocks, contractors, commodities }) {
    const blockKey = `${plan.grower_block_source_database}:${plan.grower_block_id}`;
    const block = blocks.get(blockKey);
    const blockID = block.id;
    const blockName = block.name;
    const estimatedBins = block.estimatedbins;
    const growerName = block.growerName;
    const contractor = contractors.get(plan.contractor_id ?? -1);
    const commodityIdx = getCommodityIdxFromBlockOrPlan(block, plan);
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
            commodityIdx,
            contractorName: contractor?.name ?? contractor?.NAME ?? "",
            block: block, // Include full block object for additional data access
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

    // Sort each day's plans by commodity first, then by planned bins
    for (const key of dayKeys) {
        buckets[key] = sortPlansByCommodityAndBins(buckets[key]);
    }

    return buckets;
}

export function sortPlansByCommodityAndBins(plans) {
    return plans.sort((a, b) => {
        // First sort by commodity name
        const commodityA = a._card.commodityName || "";
        const commodityB = b._card.commodityName || "";
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

export function formatBinInfo(planned, actual, estimatedBins) {
    const parts = [];
    if (planned != null) parts.push(`Planned: ${planned}`);
    if (actual != null) parts.push(`Actual: ${actual}`);
    if (estimatedBins != null) parts.push(`Remaining: ${estimatedBins}`)
    return parts.join(" · ");
}