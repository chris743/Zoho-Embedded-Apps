import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "../tableutils/formatDate";
import { hexToRgbArray } from "../tableutils/colorHelpers";

// PDF export function for filtered data
export const exportToPDF = (data, filename = "harvest-plans") => {
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
            "Field Rep": row.fieldRepresentativeName || "-",
            // Preserve contractor colors for PDF highlighting
            laborContractorColor: row.laborContractorColor,
            forkliftContractorColor: row.forkliftContractorColor,
            truckingContractorColor: row.truckingContractorColor
        }));

    // Create maps from contractor name to color for each role
    // This allows us to match cells by their content
    const laborColorMap = new Map();
    const forkliftColorMap = new Map();
    const haulerColorMap = new Map();
    
    exportData.forEach(row => {
        if (row.Labor && row.Labor !== "-" && row.laborContractorColor) {
            laborColorMap.set(row.Labor, row.laborContractorColor);
        }
        if (row.Forklift && row.Forklift !== "-" && row.forkliftContractorColor) {
            forkliftColorMap.set(row.Forklift, row.forkliftContractorColor);
        }
        if (row.Hauler && row.Hauler !== "-" && row.truckingContractorColor) {
            haulerColorMap.set(row.Hauler, row.truckingContractorColor);
        }
    });

    // Calculate commodity totals
    const commodityTotals = {};
    exportData.forEach(row => {
        const commodity = row.Commodity;
        if (!commodityTotals[commodity]) {
            commodityTotals[commodity] = { count: 0, totalBins: 0 };
        }
        commodityTotals[commodity].count++;
        commodityTotals[commodity].totalBins += Number(row.Bins) || 0;
    });

    // Create final export data with totals (keep as objects, not arrays)
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
                    Bins: total.totalBins.toString(),
                    Labor: "",
                    Forklift: "",
                    Hauler: "",
                    "Deliver To": "",
                    "Field Rep": "",
                    isTotal: true
                });
            }
            currentCommodity = row.Commodity;
        }

        // Normal data row (already has contractor colors on it)
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
            Bins: total.totalBins.toString(),
            Labor: "",
            Forklift: "",
            Hauler: "",
            "Deliver To": "",
            "Field Rep": "",
            isTotal: true
        });
    }

    // Create PDF
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    // Add title with improved styling
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 75, 50); // Green color
    doc.text('Harvest Plans Report', 40, 45);
    
    // Add date
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(105, 123, 127); // Medium gray
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 65);

    // Define table columns
    const columns = [
        { header: 'Date', dataKey: 'Date' },
        { header: 'Commodity', dataKey: 'Commodity' },
        { header: 'Grower', dataKey: 'Grower' },
        { header: 'Block', dataKey: 'Block' },
        { header: 'Pool ID', dataKey: 'Pool ID' },
        { header: 'Bins', dataKey: 'Bins' },
        { header: 'Labor', dataKey: 'Labor' },
        { header: 'Forklift', dataKey: 'Forklift' },
        { header: 'Hauler', dataKey: 'Hauler' },
        { header: 'Deliver To', dataKey: 'Deliver To' },
        { header: 'Field Rep', dataKey: 'Field Rep' }
    ];

    // Reset text color for table content
    doc.setTextColor(0, 0, 0);
    
    // Generate table
    autoTable(doc, {
        columns,
        body: finalExportData,
        startY: 105, // Adjusted for better spacing
        styles: {
            fontSize: 9,
            cellPadding: 4,
            overflow: 'linebreak',
            halign: 'left',
            lineColor: [230, 230, 230],
            lineWidth: 0.3
        },
        headStyles: {
            fillColor: [30, 75, 50], // Green theme color (#1E4B32)
            textColor: [255, 255, 255], // White text
            fontStyle: 'bold',
            fontSize: 10,
            lineWidth: 0.1
        },
        alternateRowStyles: {
            fillColor: [248, 249, 251] // Off-white for better readability
        },
        didParseCell: (data) => {
            // Skip header rows
            if (data.section === 'head') {
                return;
            }

            // Use row.raw which contains the actual data object
            const rowData = data.row.raw || {};
            const isTotalRow = !!rowData.isTotal;

            // Style total rows
            if (isTotalRow) {
                if (data.column.dataKey === 'Commodity' || data.column.dataKey === 'Bins') {
                    data.cell.styles.fontStyle = 'bold';

                }
                return;
            }

            // Only apply contractor colors to Labor, Forklift, and Hauler columns
            const columnKey = data.column.dataKey;
            if (columnKey !== 'Labor' && columnKey !== 'Forklift' && columnKey !== 'Hauler') {
                return;
            }

            // Get color from row data
            let colorHex = null;
            if (columnKey === 'Labor') {
                colorHex = rowData.laborContractorColor;
            } else if (columnKey === 'Forklift') {
                colorHex = rowData.forkliftContractorColor;
            } else if (columnKey === 'Hauler') {
                colorHex = rowData.truckingContractorColor;
            }

            // Apply the color if found
            if (colorHex) {
                const rgbColor = hexToRgbArray(colorHex, 0.2);
                if (rgbColor) {
                    // Set the fill color for the cell background
                    data.cell.styles.fillColor = rgbColor;
                    // Ensure text color is black so it's visible
                    data.cell.styles.textColor = [0, 0, 0];
                }
            }
        },
        margin: { top: 100, right: 40, bottom: 40, left: 40 }
    });

    // Save the PDF
    doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
};
