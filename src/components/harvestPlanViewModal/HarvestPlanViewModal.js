import React, { useMemo } from "react";
import {
    Dialog, DialogContent, Box
} from "@mui/material";
import { useHarvestPlanData } from "./hooks/useHarvestPlanData";
import { useScoutReports } from "./hooks/useScoutReports";
import { ModalHeader } from "./components/ModalHeader";
import { PlanOverviewSection } from "./components/PlanOverviewSection";
import { BlockInformationSection } from "./components/BlockInformationSection";
import { ResourceAllocationSection } from "./components/ResourceAllocationSection";
import { ScoutDataSection } from "./components/ScoutDataSection";
import { ModalActions } from "./components/ModalActions";

export default function ViewPlanDialog({
    open,
    onClose,
    plan,
    blocks = [],
    contractors = [],
    commodities = [],
    pools = [],
    scoutReportsSvc,
    onEdit
}) {


    // Use custom hooks for data processing
    const {
        block,
        labor,
        forklift,
        hauler,
        poolName,
        commodityName,
        commodity_idx
    } = useHarvestPlanData({ plan, blocks, contractors, commodities, pools });

    const { scoutReports, scoutImagesLoading } = useScoutReports(plan, scoutReportsSvc, block);

    // Copy to clipboard functionality
    const copyAll = useMemo(() => () => {
        try {
            const full = {
                plan,
                associated: {
                    block,
                    labor,
                    forklift,
                    hauler,
                    commodityName,
                    commodity_idx
                }
            };
            navigator.clipboard.writeText(JSON.stringify(full, null, 2));
        } catch (err) {
            console.warn("Failed to copy to clipboard:", err);
        }
    }, [plan, block, labor, forklift, hauler, commodityName, commodity_idx]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: 'background.default',
                },
            }}
        >
            <ModalHeader 
                plan={plan}
                block={block}
                onClose={onClose}
                onCopyAll={copyAll}
            />

            <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
                {/* Plan + Block + Resources */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <PlanOverviewSection 
                        plan={plan}
                        poolName={poolName}
                    />
                    
                    <BlockInformationSection 
                        block={block}
                        commodityName={commodityName}
                    />
                    
                    <ResourceAllocationSection 
                        plan={plan}
                        labor={labor}
                        forklift={forklift}
                        hauler={hauler}
                    />
                </Box>

                <ScoutDataSection 
                    scoutReports={scoutReports}
                    scoutImagesLoading={scoutImagesLoading}
                />
            </DialogContent>

            <ModalActions 
                onClose={onClose}
                onEdit={onEdit}
                plan={plan}
            />
        </Dialog>
    );
}