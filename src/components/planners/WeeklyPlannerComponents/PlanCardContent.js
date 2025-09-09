import { Button, Stack } from "@mui/material";
import { PlanTitle } from "./PlanTitle";
import { PlanDetails } from "./PlanDetails";
import { ContractorInfo } from "./ContractorInfo";
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
      {_card.contractorName && (
        <ContractorInfo name={_card.contractorName} />
      )}
        <Stack direction="row" spacing = '0.8rem' sx={{justifyContent: "center"}}>
            <Button onClick={editClick} size="small" variant="outlined" color="secondary">Edit</Button>
            <Button onClick={viewClick} size="small" variant="outlined" color="primary">View</Button>
        </Stack>
    </Stack>
  );
});

PlanCardContent.displayName = 'PlanCardContent';