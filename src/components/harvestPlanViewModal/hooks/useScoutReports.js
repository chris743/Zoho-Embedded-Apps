import { useState, useEffect } from "react";

/**
 * Custom hook for fetching and managing scout reports
 */
export function useScoutReports(plan, scoutReportsSvc, block) {
  const [scoutReports, setScoutReports] = useState([]);
  const [scoutImagesLoading, setScoutImagesLoading] = useState(false);



  useEffect(() => {

    // Don't fetch if we don't have the required data
    if (!plan || !scoutReportsSvc) {
      return;
    }

    const fetchScoutReports = async () => {
      if (!plan || !scoutReportsSvc) {
        return;
      }

      // The API expects blockNumber_Ref to match block.id (the string ID)
      const blockId = block?.id;
      
      if (!blockId) {
        console.warn("No block ID found for scout report lookup", { block, plan });
        return;
      }

      // Clear existing data to ensure fresh state
      setScoutReports([]);
      setScoutImagesLoading(true);
      
      try {
        
        // Try different parameter names since the API seems to be returning all data
        const cacheBuster = Date.now();
        const apiParams = {
          blockNumber_Ref: blockId,
          blockId: blockId,
          block_id: blockId,
          blockNumber: blockId,
          blockNumberRef: blockId,
          take: 10,
          orderBy: "DateCreated desc",
          _t: cacheBuster, // Cache buster
          timestamp: cacheBuster // Alternative cache buster
        };
        
        const { data } = await scoutReportsSvc.listWithBlock(apiParams);
        const arr = Array.isArray(data) ? data : (data?.items || data?.value || data?.$values || []);
        
        if (arr.length > 0) {
          // Check if any reports match our block ID
          const matchingReports = arr.filter(r => {
            const reportBlockId = r.blockNumber_Ref || r.block_id || r.blockId || r.blockNumber;
            return String(reportBlockId) === String(blockId); // Convert both to strings for comparison
          });
          
          // If the API didn't filter properly, filter on the frontend
          if (matchingReports.length > 0) {
            setScoutReports(matchingReports);
          } else {
            setScoutReports([]); // Show no data instead of all reports
          }
        } else {
          setScoutReports(arr);
        }
      } catch (err) {
        console.warn("Failed to fetch scout reports:", err);
        setScoutReports([]);
      } finally {
        setScoutImagesLoading(false);
      }
    };

    fetchScoutReports();
  }, [plan, scoutReportsSvc, block]);

  return {
    scoutReports,
    scoutImagesLoading
  };
}
