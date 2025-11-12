import { Stack } from "@mui/material";
import { PlanTitle } from "./PlanTitle";
import { PlanDetails } from "./PlanDetails";
import { memo } from "react";

export const PlanCardContent = memo(({ plan, editClick, viewClick }) => {
  const { _card } = plan;
  
  return (
    <Stack spacing={1.2}>
      <PlanTitle blockName={_card.blockName} grower={_card.grower} blockID={_card.blockID} />
      <PlanDetails 
        commodityName={_card.commodityName}
        plannedBins={plan.planned_bins}
        actualBins={plan.bins}
        estimatedBins={_card.estimatedBins}
      />
    </Stack>
  );
});

PlanCardContent.displayName = 'PlanCardContent';