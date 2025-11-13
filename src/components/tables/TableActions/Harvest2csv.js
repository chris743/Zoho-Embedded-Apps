import Papa from "papaparse";
import { formatDate } from "../tableutils/formatDate";

// Export function for filtered data
export const exportToCSV = (data, filename = "harvest-plans") => {
    // Filter out total rows and prepare data for export
    const exportData = data
        .filter(row => !row.isTotal) // Remove total rows
        .map(row => ({
            Date: formatDate(row.date),
            Commodity: row.commodityName || "-",
            Grower: row.grower_name || "-",
            Block: row.block_display || "-",
            "Pool ID": row.pool?.id || "-",
            Bins: row.bins ?? row.planned_bins ?? 0,
            Labor: row.laborContractorName || "-",
            Forklift: row.forkliftContractorName || "-",
            Hauler: row.truckingContractorName || "-",
            "Deliver To": row.deliver_to || "-",
            "Field Rep": row.fieldRepresentativeName || "-"
        }));

    // Add commodity totals as separate rows
    const commodityTotals = {};
    exportData.forEach(row => {
        const commodity = row.Commodity;
        if (!commodityTotals[commodity]) {
            commodityTotals[commodity] = { count: 0, totalBins: 0 };
        }
        commodityTotals[commodity].count++;
        commodityTotals[commodity].totalBins += row.Bins;
    });

    // Create final export data with totals
    const finalExportData = [];
    let currentCommodity = null;
    
    exportData.forEach(row => {
        // Add commodity total row when commodity changes
        if (currentCommodity !== row.Commodity) {
            if (currentCommodity && commodityTotals[currentCommodity]) {
                const total = commodityTotals[currentCommodity];
                finalExportData.push({
                    Date: "",
                    Commodity: `${currentCommodity} Total (${total.count} plans)`,
                    Grower: "",
                    Block: "",
                    "Pool ID": "",
                    Bins: total.totalBins,
                    Labor: "",
                    Forklift: "",
                    Hauler: "",
                    "Deliver To": "",
                    "Field Rep": ""
                });
            }
            currentCommodity = row.Commodity;
        }
        finalExportData.push(row);
    });

    // Add final commodity total
    if (currentCommodity && commodityTotals[currentCommodity]) {
        const total = commodityTotals[currentCommodity];
        finalExportData.push({
            Date: "",
            Commodity: `${currentCommodity} Total (${total.count} plans)`,
            Grower: "",
            Block: "",
            "Pool ID": "",
            Bins: total.totalBins,
            Labor: "",
            Forklift: "",
            Hauler: "",
            "Deliver To": "",
            "Field Rep": ""
        });
    }

    // Generate CSV
    const csv = Papa.unparse(finalExportData);
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
